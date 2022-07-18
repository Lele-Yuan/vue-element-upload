import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { downloadFile } from '../utils';

axios.interceptors.response.use((response: AxiosResponse) => {
    if (response.data instanceof Blob) {
        return downloadFile(response);
    }
    return response;
}, (error) => {
    // 对响应错误做点什么
    if (error.response) {
        // error.response.status 状态码
        return Promise.reject(error.response.data);
    } else {
        return Promise.reject(error);
    }
});

const defaultConfig = {
    // withCredentials: true,  //跨域携带cookie
};
export const createAxios = (config: AxiosRequestConfig): AxiosInstance => {
    const instance = axios.create({
        ...defaultConfig,
        ...config,   // 自定义配置覆盖基本配置
    });

    return instance;
};

