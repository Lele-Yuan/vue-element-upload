import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
    "server": {
        port: 8080,
        proxy: {
            '/api': {
                target: 'https://localhost:3000',
                secure: false,
                pathRewrite: {
                    '^/api': ''
                }
            }
        }
    },
    "plugins": [vue()],
    "resolve": {
        // 配置别名
        "alias": {
            "@": resolve("src"),
            // 使用路径别名时想要省略的后缀名
            "extensions": [".js", ".json", ".ts", ".vue"]
        }
    }
});
