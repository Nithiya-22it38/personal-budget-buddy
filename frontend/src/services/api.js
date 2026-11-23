// import axios from 'axios'

// const BASE_URL = 'http://127.0.0.1:8000/api'

// const api = axios.create({
//   baseURL: BASE_URL,
// })

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('access')
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`
//   }
//   return config
// })

// function logoutUser() {
//   localStorage.removeItem('access')
//   localStorage.removeItem('refresh')
//   window.location.href = '/login'
// }

// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config

//     if (!error.response) {
//       return Promise.reject(error)
//     }

//     const isUnauthorized = error.response.status === 401
//     const isLoginRequest = originalRequest.url === '/auth/login/'

//     if (!isUnauthorized || isLoginRequest || originalRequest.alreadyRetried) {
//       return Promise.reject(error)
//     }

//     originalRequest.alreadyRetried = true

//     const refreshToken = localStorage.getItem('refresh')
//     if (!refreshToken) {
//       logoutUser()
//       return Promise.reject(error)
//     }

//     try {
//       const response = await axios.post(BASE_URL + '/auth/token/refresh/', {
//         refresh: refreshToken,
//       })

//       const newAccess = response.data.access
//       localStorage.setItem('access', newAccess)

//       originalRequest.headers.Authorization = `Bearer ${newAccess}`
//       return api(originalRequest)
//     } catch (refreshError) {
//       logoutUser()
//       return Promise.reject(refreshError)
//     }
//   }
// )

// export default api

///deploy to vercel

import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api