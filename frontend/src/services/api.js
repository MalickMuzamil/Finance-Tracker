import axios from 'axios';
export const api=axios.create({baseURL:import.meta.env.VITE_API_URL||'http://localhost:5000/api'});
api.interceptors.request.use(c=>{const t=localStorage.getItem('ft_token');if(t)c.headers.Authorization=`Bearer ${t}`;return c});
export async function request(p){try{return (await p).data}catch(e){throw new Error(e.response?.data?.message||'Something went wrong')}}
