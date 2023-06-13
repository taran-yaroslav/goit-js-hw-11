import './style/style.css';
import axios from 'axios';
import Notiflix from 'notiflix';
import SimpleLightbox from "simplelightbox";
import "simplelightbox/dist/simple-lightbox.min.css";

const formEl = document.querySelector('.search-form');
const galleryEl = document.querySelector('.gallery');
// const loadMoreBtn = document.querySelector('.load-more')
const infiniteScroll = document.querySelector('.js-scroll')

Notiflix.Notify.init({
    position: 'center-top',
    distance: '45px',
    timeout: 2000,
    cssAnimationStyle: 'zoom',
    fontFamily: 'Arial, sans-serif',
});

let lightbox;
let options = {
  root: null,
  rootMargin: "200px",
  threshold: 1.0,
};

let observer = new IntersectionObserver(onLoadPage, options);

const BASE_URL = 'https://pixabay.com/api/';
const API_KEY = '36956976-ac77797dbc5715892646935b7';

let page = 1;
let totalPage = 0
const itemsOnPage = 40;
let currentSearch = ''

const searchParams = new URLSearchParams({
    key: API_KEY,
    image_type: 'photo',
    orientation: 'horizontal',
    safesearch: true,
    page: page,
    per_page: itemsOnPage

});

async function getData(value) {
    const response = await axios.get(`${BASE_URL}?${searchParams}&q=${value}`);
    return response.data;
}

formEl.addEventListener('submit', handlerSearch);

async function handlerSearch (e) {
    e.preventDefault();

    const { searchQuery: { value } } = e.currentTarget.elements
    
    if (value.trim() === '') {
        return notFoundMassage();
    }

    currentSearch = value;
    page = 1;
    galleryEl.innerHTML = '';

    await renderData()
    observer.observe(infiniteScroll)

    setLightbox();
    

}

async function renderData() {
    try {
        searchParams.set('page', page);
        const data = await getData(currentSearch);
        const { hits, totalHits } = data;
        totalPage = Math.ceil(totalHits / itemsOnPage)
           
        if (hits.length === 0) {
            return notFoundMassage();
        }
        if (page === 1) {
            Notiflix.Notify.success(`Hooray! We found ${totalHits} images.`)
        }

        galleryEl.insertAdjacentHTML('beforeend', getMarkupItem(hits));
    } catch (err) {
        console.error(err.message) 
    }
}

function getMarkupItem(arr) {
    const photoCard = arr.map(({ tags,largeImageURL, webformatURL, views, downloads, likes, comments }) => `
            
            <div class="photo-card">
                <a href="${largeImageURL}">
                    <img src="${webformatURL}" alt="${tags}" loading="lazy" />
                </a>
                <div class="info">
                    <p class="info-item">
                        <b>Likes</b>
                        ${likes}
                    </p>
                    <p class="info-item">
                        <b>Views</b>
                        ${views}
                    </p>
                    <p class="info-item">
                        <b>Comments</b>
                        ${comments}
                    </p>
                    <p class="info-item">
                        <b>Downloads</b>
                        ${downloads}
                    </p>
                </div>
                </div>`
    ).join('')
    return photoCard; 
};

function notFoundMassage() {
    Notiflix.Notify.failure('Sorry, there are no images matching your search query. Please try again.'); 
};

function maxFoundMassage() {
    Notiflix.Notify.warning('We&#96re sorry, but you&#96ve reached the end of search results.'); 
}

function smoothScroll() {
 const { height: cardHeight } = galleryEl
  .firstElementChild.getBoundingClientRect();

window.scrollBy({
  top: cardHeight * 2,
  behavior: "smooth",
});
}

function setLightbox() {
    lightbox = new SimpleLightbox('.photo-card a', {
    navText: ['&#10094;', '&#10095;'],
    captionsData: 'alt',
    captionDelay: 250,
    showCounter: false,
   });
}

async function onLoadPage(entries, observer) {
    entries.forEach(async (entry) => {
        
        if (entry.isIntersecting) {
            page += 1;
            
            if (page > totalPage) {
                maxFoundMassage();
                observer.unobserve(infiniteScroll);
                return
            }
            await renderData();
            smoothScroll();
            lightbox.refresh();
        }
    });
}











