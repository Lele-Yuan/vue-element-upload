import { createApp } from 'vue';
import App from './App.vue';
import 'element-plus/dist/index.css';
import {
    ElUpload,
    ElButton,
    ElProgress,
    ElMessage,
    makeInstaller
} from 'element-plus';

const components = [ElUpload, ElButton, ElProgress];
const elementPlus = makeInstaller(components);
window.$message = ElMessage;
const app = createApp(App);
app.use(elementPlus, { size: 'small' });

app.mount('#app');
