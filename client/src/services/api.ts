import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Transform PascalCase API response to camelCase
function transformListingData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  
  const transformed = { ...data };
  
  // Transform common fields from PascalCase to camelCase
  if (transformed.Id !== undefined) transformed.id = transformed.Id;
  if (transformed.Title !== undefined) transformed.title = transformed.Title;
  if (transformed.Description !== undefined) transformed.description = transformed.Description;
  if (transformed.Price !== undefined) transformed.price = transformed.Price;
  if (transformed.Currency !== undefined) transformed.currency = transformed.Currency;
  if (transformed.Category !== undefined) transformed.category = transformed.Category;
  if (transformed.Status !== undefined) transformed.status = transformed.Status;
  if (transformed.Condition !== undefined) transformed.condition = transformed.Condition;
  if (transformed.ISBN !== undefined) transformed.isbn = transformed.ISBN;
  if (transformed.CourseCode !== undefined) transformed.courseCode = transformed.CourseCode;
  if (transformed.Location !== undefined) transformed.location = transformed.Location;
  if (transformed.IsNegotiable !== undefined) transformed.isNegotiable = transformed.IsNegotiable;
  if (transformed.ViewsCount !== undefined) transformed.viewsCount = transformed.ViewsCount;
  if (transformed.UserId !== undefined) transformed.userId = transformed.UserId;
  if (transformed.SellerName !== undefined) transformed.sellerName = transformed.SellerName;
  if (transformed.ImageUrls !== undefined) transformed.imageUrls = transformed.ImageUrls;
  if (transformed.CreatedAt !== undefined) transformed.createdAt = transformed.CreatedAt;
  if (transformed.UpdatedAt !== undefined) transformed.updatedAt = transformed.UpdatedAt;
  
  // Transform User fields
  if (transformed.Email !== undefined) transformed.email = transformed.Email;
  if (transformed.FirstName !== undefined) transformed.firstName = transformed.FirstName;
  if (transformed.LastName !== undefined) transformed.lastName = transformed.LastName;
  if (transformed.FullName !== undefined) transformed.fullName = transformed.FullName;
  if (transformed.PhoneNumber !== undefined) transformed.phoneNumber = transformed.PhoneNumber;
  if (transformed.StudentId !== undefined) transformed.studentId = transformed.StudentId;
  if (transformed.University !== undefined) transformed.university = transformed.University;
  if (transformed.Faculty !== undefined) transformed.faculty = transformed.Faculty;
  if (transformed.YearOfStudy !== undefined) transformed.yearOfStudy = transformed.YearOfStudy;
  if (transformed.ProfileImageUrl !== undefined) transformed.profileImageUrl = transformed.ProfileImageUrl;
  if (transformed.Rating !== undefined) transformed.rating = transformed.Rating;
  if (transformed.ReviewsCount !== undefined) transformed.reviewsCount = transformed.ReviewsCount;
  if (transformed.IsEmailVerified !== undefined) transformed.isEmailVerified = transformed.IsEmailVerified;
  if (transformed.IsPhoneVerified !== undefined) transformed.isPhoneVerified = transformed.IsPhoneVerified;
  
  // Transform Order fields
  if (transformed.ListingId !== undefined) transformed.listingId = transformed.ListingId;
  if (transformed.BuyerId !== undefined) transformed.buyerId = transformed.BuyerId;
  if (transformed.SellerId !== undefined) transformed.sellerId = transformed.SellerId;
  if (transformed.MeetingLocation !== undefined) transformed.meetingLocation = transformed.MeetingLocation;
  if (transformed.MeetingTime !== undefined) transformed.meetingTime = transformed.MeetingTime;
  if (transformed.Notes !== undefined) transformed.notes = transformed.Notes;
  if (transformed.OrderStatus !== undefined) transformed.orderStatus = transformed.OrderStatus;

  // Transform Auth response fields
  if (transformed.AccessToken !== undefined) transformed.accessToken = transformed.AccessToken;
  if (transformed.RefreshToken !== undefined) transformed.refreshToken = transformed.RefreshToken;
  if (transformed.User !== undefined) transformed.user = transformed.User;
  
  return transformed;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    // Transform PascalCase to camelCase for listings
    if (response.data && Array.isArray(response.data)) {
      response.data = response.data.map(transformListingData);
    } else if (response.data && typeof response.data === 'object') {
      response.data = transformListingData(response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config || {};

    // Extract server-provided message (supports PascalCase/ camelCase)
    const serverMessage =
      error.response?.data?.message ||
      error.response?.data?.Message ||
      error.response?.data?.error ||
      error.response?.data?.title;

    // Attach a user-friendly message for consumers
    let userMessage = serverMessage;
    const status = error.response?.status;
    const url = error.config?.url;
    
    console.log(`🚨 API Error: ${status} ${error.config?.method?.toUpperCase()} ${url}`);
    
    if (!userMessage) {
      switch (status) {
        case 400:
          if (url?.includes('/auth/login')) {
            userMessage = 'Некоректні дані. Перевірте формат email і спробуйте ще раз.';
          } else {
            userMessage = 'Некоректні дані. Перевірте форму і спробуйте ще раз.';
          }
          break;
        case 401:
          if (url?.includes('/auth/login')) {
            userMessage = 'Неправильний email або пароль. Перевірте дані і спробуйте ще раз.';
          } else {
            userMessage = 'Потрібна авторизація. Увійдіть у систему.';
          }
          break;
        case 403:
          userMessage = 'Доступ заборонено.';
          break;
        case 404:
          userMessage = 'Ресурс не знайдено.';
          break;
        case 500:
          userMessage = 'Проблема з сервером. Спробуйте пізніше.';
          break;
        default:
          userMessage = 'Сталася помилка. Спробуйте пізніше.';
      }
    }
    error.userMessage = userMessage;

    if (status === 401 && !originalRequest._retry && !url?.includes('/auth/refresh-token')) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
        const responseData = transformListingData(response.data);
        const newAccessToken = responseData.accessToken || responseData.AccessToken;

        if (!newAccessToken) {
          throw new Error('No access token in refresh response');
        }

        localStorage.setItem('accessToken', newAccessToken);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.log('🔄 Refresh token failed, clearing tokens:', refreshError);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // Дозволяємо компонентам обробити відсутність авторизації
      }
    }
    return Promise.reject(error);
  }
);

export default api;