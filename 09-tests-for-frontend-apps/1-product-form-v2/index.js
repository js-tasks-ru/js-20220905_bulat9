import SortableList from '../2-sortable-list/index.js';
import escapeHtml from './utils/escape-html.js';
import fetchJson from './utils/fetch-json.js';

const IMGUR_CLIENT_ID = '28aaa2e823b03b1';
const IMGUR_CLIENT = 'https://api.imgur.com/';

const BACKEND_URL = 'https://course-js.javascript.ru';


export default class ProductForm {
  subElements = {}
  data = {}
  images = []

  constructor(
    productId,
    {
      categoriesPath = '/api/rest/categories',
      productPath = `/api/rest/products`,
      imagePath = '3/image'
    } = {}
  ) {
    this.productId = productId;
  
    this.urls = {
      categories: new URL(categoriesPath, BACKEND_URL),
      product: new URL(productPath, BACKEND_URL),
      images: new URL(imagePath, IMGUR_CLIENT),
    };
  }

  setSearchParamsOfURLs() {
    const {categories, product} = this.urls;

    categories.searchParams.set('_sort', 'weigh');
    categories.searchParams.set('_refs', 'subcategory');

    product.searchParams.set('id', this.productId);
  }

  deleteSearchParamsOfURLs() {
    const {categories, product} = this.urls;

    categories.searchParams.delete('_sort');
    categories.searchParams.delete('_refs');

    product.searchParams.delete('id');
  }

  getTitle() {
    return (
      `<fieldset>
        <label class="form-label">Название товара</label>
        <input required="" 
               autofocus
               type="text"
               name="title"
               class="form-control"
               placeholder="Название товара"
               value=""
               >
      </fieldset>`
    );
  }

  getDescription() {
    return (
      `<label class="form-label">Описание</label>
       <textarea required="" 
                 class="form-control" 
                 name="description" 
                 data-element="productDescription" 
                 placeholder="Описание товара"
                 value=""
                 ></textarea>`
    );
  }

  getImage(image) {
    const { source, url } = image;
    const escapedSource = escapeHtml(source);
    const escapedUrl = escapeHtml(url);

    const wrapper = document.createElement('div');
    wrapper.innerHTML =
      `<li class="products-edit__imagelist-item">
        <input type="hidden" name="url" value="${escapedUrl}">
        <input type="hidden" name="source" value="${escapedSource}">
        <span>
          <img src="icon-grab.svg" data-grab-handle="" alt="grab">
          <img class="sortable-table__cell-img" alt="Image" src="${escapedUrl}">
          <span>${escapedSource}</span>
        </span>
        <button type="button">
          <img src="icon-trash.svg" data-delete-handle="" alt="delete">
        </button>
      </li>`;
    return wrapper.firstElementChild;
  }

  getImages() {
    return (
      ` <label class="form-label">Фото</label>
        <div data-element="imageListContainer"></div>
        <button type="button" name="uploadImage" class="button-primary-outline">
          <span>Загрузить</span>
        </button>`
    );
  }

  getCategory(category) {
    const { title: titleOfCat, subcategories } = category;

    const options = subcategories.map((subcategory) => {
      const {id, title: titleOfSubcat} = subcategory;
      const text = `${escapeHtml(`${titleOfCat} > ${titleOfSubcat}`)}`;
      return `<option value="${escapeHtml(id)}">${text}</option>`;
    });

    return options.join('');
  }

  getCategories() {
    const { categories = [] } = this.data;
    
    return (
      `<label class="form-label">Категория</label>
      <select class="form-control" name="subcategory">
        ${categories.map(this.getCategory).join('')}
      </select>`
    );
  }

  getPrice() {
    return (
      `<fieldset>
        <label class="form-label">Цена ($)</label>
        <input required="" 
               type="number"
               name="price"
               class="form-control"
               placeholder="100"
               value="">
      </fieldset>`
    );
  }

  getDiscount() {
    return (
      `<fieldset>
        <label class="form-label">Скидка ($)</label>
        <input required="" 
               type="number" 
               name="discount" 
               class="form-control" 
               placeholder="0"
               value="">
      </fieldset>`
    );
  }

  getQuantity() {
    return (
      `<label class="form-label">Количество</label>
       <input required="" 
              type="number"
              class="form-control"
              name="quantity"
              placeholder="1"
              value="">`
    );
  }

  getStatus() {
    return (
      `<label class="form-label">Статус</label>
        <select class="form-control" name="status" value=''>
          <option value="1">Активен</option>
          <option value="0">Неактивен</option>
        </select>`
    );
  }

  getElement() {
    const wrapper = document.createElement('div');
    const form = (
      `<div class="product-form">
        <form data-element="productForm" class="form-grid">
          <div class="form-group form-group__half_left">
            ${this.getTitle()}
          </div>
          <div class="form-group form-group__wide">
            ${this.getDescription()}
          </div>
          <div class="form-group form-group__wide" data-element="sortableListContainer">
            ${this.getImages()}
          </div>
          <div class="form-group form-group__half_left">
            ${this.getCategories()}
          </div>
          <div class="form-group form-group__half_left form-group__two-col">
            ${this.getPrice()}
            ${this.getDiscount()}
          </div>
          <div class="form-group form-group__part-half">
            ${this.getQuantity()}
          </div>
          <div class="form-group form-group__part-half">
            ${this.getStatus()}
          </div>
          <div class="form-buttons">
            <button type="submit" name="save" class="button-primary-outline">
              Сохранить товар
            </button>
          </div>
        </form>
      </div>`
    );
    wrapper.innerHTML = form;
    return wrapper.firstElementChild;
  }

  async fetchUnmutableRequest(url) {
    try {
      const response = await fetch(url.toString());
      if (response.ok) {return await response.json();} 
      
      throw new Error('error at server (unmutable request)');
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }

  async fetchMutableRequest(method, body) {
    const { product } = this.urls;
    try {
      const response = await fetch(product.toString(), {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {throw new Error('error at server (mutable request)');}
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }

  isRequiredURL(nameOfUrl) {
    const validURLs = this.productId ? ['product', 'categories'] : ['categories'];
    return validURLs.includes(nameOfUrl);
  }

  async getData() {
    this.setSearchParamsOfURLs();

    const namesOfURLs = Object.keys(this.urls);
    const requiredURLs = Object.values(this.urls)
      .filter((_, index) => this.isRequiredURL(namesOfURLs[index]));
    
    const responses = requiredURLs.map(this.fetchUnmutableRequest);

    const dataOfResponses = await Promise.all(responses);
    
    const entriesOfResponses = dataOfResponses.map((data, index) => {
      const nameOfData = namesOfURLs[index];
      if (nameOfData === 'product') {this.images = data[0].images ?? [];}
      return [nameOfData, data];
    });

    this.deleteSearchParamsOfURLs();
    return Object.fromEntries(entriesOfResponses);
  }

  getFormatedFormData() {
    const keysWithNumberValue = ['discount', 'price', 'quantity', 'status'];
    const formatedFormData = {
      images: this.images,
    };

    const { productForm } = this.subElements;
    const formData = new FormData(productForm);
    formData.delete('url');
    formData.delete('source');

    const id = this.productId ? this.productId : formData.get('title');
    formData.set('id', id);

    for (const [key, value] of formData.entries()) {
      formatedFormData[key] = keysWithNumberValue.includes(key) ? Number(value) : value;
    }

    return formatedFormData;
  }

  toggleStatusOfLoadingImage() {
    const { productForm} = this.subElements;
    productForm.uploadImage.classList.toggle("is-loading");
    productForm.uploadImage.disabled = !productForm.uploadImage.disabled;
  }

  async postImage(formData) {
    try {
      const { images } = this.urls;
      this.toggleStatusOfLoadingImage();

      const response = await fetch(images.toString(), {
        method: 'POST',
        headers: {
          Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
        },
        body: formData,
        referrer: ''
      });
      const responseJSON = await response.json();

      this.toggleStatusOfLoadingImage();
      return responseJSON.data.link;

    } catch (error) {
      console.error(error);
      return null;
    }
  }

  getInputIMGLoader() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `<input name="image" type="file" accept="image/*" hidden/>`;
    return wrapper.firstElementChild;
  }

  loadImgHander = () => {
    const {productForm, sortableList} = this.subElements;

    const inputIMGLoader = this.getInputIMGLoader();

    inputIMGLoader.onchange = async () => {

      const formData = new FormData();
      const file = inputIMGLoader.files[0];
      formData.append(inputIMGLoader.name, file);

      const link = await this.postImage(formData);

      if (!link) {
        inputIMGLoader.remove();
        return;
      }

      const image = {source: file.name, url: link};
      this.images.push(image);
      sortableList.append(...SortableList.addClassesOfItems([this.getImage(image)]));

      inputIMGLoader.remove();
    };

    productForm.append(inputIMGLoader);
    inputIMGLoader.click();
    
  } 

  submitHandler = (event) => {
    event.preventDefault();

    const formData = this.getFormatedFormData();

    const [nameOfEvent, method] = this.productId 
      ? ['product-updated', 'PATCH'] 
      : ['product-saved', 'PUT'];

    this.element.dispatchEvent(new CustomEvent(nameOfEvent, {
      bubles: true,
      detail: formData,
    }));

    this.fetchMutableRequest(method, formData);
  }

  removeListItemHandler = (event) => {
    event.preventDefault();
    const target = event.target;

    if (!target.closest('[data-delete-handle]')) {return;}

    const listItem = target.closest('[data-element="sortableItem"]');
    const inputs = listItem.querySelectorAll('input');
    const imageForRemoving = {};

    for (const input of inputs) {
      imageForRemoving[input.name] = input.value;
    }
  
    const { url: remUrl, source: remSource } = imageForRemoving;

    this.images = this.images.filter(({url, source}) => (url !== remUrl) && (source !== remSource));
  }

  setSubElements() {
    const elements = this.element.querySelectorAll('[data-element]');
    elements.forEach((element) => {
      const name = element.dataset.element;
      this.subElements[name] = element;
    });
  }

  addEventListeners() {
    const { productForm, imageListContainer } = this.subElements;
    productForm.addEventListener('submit', this.submitHandler);
    productForm.uploadImage.addEventListener('click', this.loadImgHander);
    imageListContainer.addEventListener('pointerdown', this.removeListItemHandler);
  }

  createProduct() {
    const namesForFilling = ['title', 'description', 'price', 'discount', 'quantity', 'status'];

    const productForm = this.element.querySelector('[data-element="productForm"]');

    Array.from(productForm.elements).forEach((element) => {
      const name = element.name;
      if (namesForFilling.includes(name)) {
        const value = this.data.product[0][name];
        productForm[name].value = value;
      }
    });
  
  }

  createImages() {
    const imageListContainer = this.element.querySelector('[data-element="imageListContainer"]');
    const sortableList = new SortableList({items: this.images.map(this.getImage)});
    imageListContainer.append(sortableList.element);
  }

  async render() {
    this.data = await this.getData();
    this.element = this.getElement();

    if (this.productId) { this.createProduct(); }
    this.createImages();
    this.setSubElements();
    this.addEventListeners();
  }

  remove() {
    this.element?.remove();
    this.element = null;
  }

  destroy() {
    this.remove();
  }
}
