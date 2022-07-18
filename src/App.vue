<script setup lang="ts">
import { ref } from 'vue';
import UploadFile from './components/UploadFile.vue';
import { createAxios } from '@/api/http';
const state = ref();
const test = () => {
    createAxios().get('/api/', {params: {a: 1}});
};
</script>

<template>
    <upload-file />
    <el-button type="primary" @click="test">
        测试
    </el-button>
</template>

<style>
#app {
	font-family: Avenir, Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	text-align: center;
	color: #2c3e50;
	margin-top: 60px;
}
.scan-wrap {
    position: relative;
    width: 100%;
    height: 654px;
    background: #343434;
}
.scan {
    position: absolute;
    z-index: 7;
    top: 0;
    left: 0;
    width: 100%;
    border-bottom: 3px solid #3e88f1;
    -webkit-animation: scan 1.2s infinite;
    -moz-animation: scan 1.2s infinite;
    animation: scan 1.2s infinite;
    background: linear-gradient(180deg,transparent,#3e88f1);
}
@keyframes scan{
    0%{ height:0 }
    to{ opacity:0; height:524px }
}
</style>
