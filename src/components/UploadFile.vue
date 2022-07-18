<template>
    <el-upload
        ref="uploadRef"
        class="upload-wrap"
        :auto-upload="false"
        action="/"
        :on-change="onFileChange"
        :on-exceed="handleExceed"
        :limit="1"
    >
        <el-button>
            <i class="iconfont icon-upload" />
            文件上传
        </el-button>
        <template #tip>
            <div class="tip">
                仅允许上传1个文件，大小不超100M，多个附件请以压缩包上传
            </div>
        </template>
        <template #file="{ file }">
            <div class="el-upload-list__item-info">
                <span>{{ file.name }}</span>
            </div>
            <el-button
                type="text"
                @click="handleDelete"
            >
                删除
            </el-button>
            <!-- <label class="el-icon el-upload-list__item-status-label">
                <i
                    v-if="currentFile.percentage >= 100"
                    class="el-icon-upload-success el-icon-circle-check"
                />
            </label>
            <el-progress
                :percentage="currentFile.percentage"
                :status="currentFile.status === 'fail' ? 'exception' : ''"
            /> -->
        </template>
    </el-upload>
    {{ state.attachedUrl }}
</template>
<script lang="ts" setup>
import SparkMD5 from 'spark-md5';
import { reactive, ref } from 'vue-demi';
import { createAxios } from '@/api/http.ts';

const chunkSize = 9 * 1024 * 1024;
const maxSize = 100 * 1024 * 1024;
const simultaneousUploads = 1; // 并发数量
const chunkRetryCount = 3; // 最多重试3次
const FileStatusMap = {
    uploading: 'uploading',
    success: 'success',
    error: 'fail'
};
const uploadRef = ref();
const state = reactive({
    attachedUrl: '',
    currentFile: {} as any,
    totalChunks: 0
});
const instance = createAxios();
const checkFileUploadedByMd5 = (params: {
    md5: string;
    fileName: string;
}) => {
    return instance.get('/api/fileChunk/presence', { params }).then((res: any) => {
        return res.data;
    });
};
const uploadHrAttachment = (formdata: FormData, onUploadProgress: any) => {
    return instance.post('/api/fileChunk', formdata, onUploadProgress);
};
const getAttachmentUrl = (formdata: {
    md5: string;
    fileName: string;
    fileChunkNum: number;
}) => {
    return instance.post('/api/fileChunk/merge', formdata).then((res: any) => res.data);
};
/**
 * 分片读取文件 MD5
 */
const getFileMd5 = (file: Blob) => {
    const blobSlice = File.prototype.slice || (File.prototype as any).mozSlice || (File.prototype as any).webkitSlice;
    const fileReader = new FileReader();
    // 计算分片数
    state.totalChunks = Math.ceil(file.size / chunkSize);
    console.log('总分片数：' + state.totalChunks);
    let currentChunk = 0;
    const spark = new SparkMD5.ArrayBuffer();
    function loadNext () {
        const start = currentChunk * chunkSize;
        const end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize;
        // 注意这里的 fileRaw
        fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
    }
    loadNext();
    return new Promise((resolve) => {
        fileReader.onload = (e: ProgressEvent<FileReader>) => {
            try {
                spark.append((e.target as FileReader).result as ArrayBuffer);
            } catch (error) {
                console.log('获取Md5错误：' + currentChunk);
            }
            if (currentChunk < state.totalChunks) {
                currentChunk++;
                loadNext();
            } else {
                resolve(spark.end());
            }
        };
        fileReader.onerror = () => {
            // window.$message.error('读取Md5失败，文件读取错误');
            resolve('');
        };
    });
};
const createFileChunk = (file: Blob, size = chunkSize) => {
    const fileChunkList = [];
    let count = 0;
    while (count < file.size) {
        fileChunkList.push({
            file: file.slice(count, count + size)
        });
        count += size;
    }
    return fileChunkList;
};
const getCurrentFileProgress = () => {
    if (!state.currentFile || !state.currentFile.chunkList) return;
    const chunkList = state.currentFile.chunkList;
    const uploadedSize = chunkList.map((item: any) => item.file.size * item.progress).reduce((acc: any, cur: any) => acc + cur);
    // 计算方式：已上传大小 / 文件总大小
    const progress = parseInt((uploadedSize / state.currentFile.size).toFixed(2));
    state.currentFile.percentage = progress;
};
const updateChunkUploadStatus = (item: any) => {
    let status = FileStatusMap.uploading;
    let progressStatus = 'normal';
    if (item.progress >= 100) {
        status = FileStatusMap.success;
        progressStatus = 'success';
    }
    const chunkIndex = item.chunkNumber - 1;
    const currentChunk = state.currentFile.chunkList[chunkIndex];
    // 修改状态
    currentChunk.status = status;
    currentChunk.progressStatus = progressStatus;
    // 获取文件上传进度
    getCurrentFileProgress();
};
/**
 * 处理即将上传的分片列表，判断是否有已上传的分片，有则从列表中删除
 */
const filterUploadChunkList = (chunkList: any[]) => {
    const chunkUploadedList = state.currentFile.chunkUploadedList;
    if (chunkUploadedList === undefined || chunkUploadedList === null || chunkUploadedList.length === 0) {
        return chunkList;
    }
    for (let i = chunkList.length - 1; i >= 0; i--) {
        const chunkItem = chunkList[i];
        for (let j = 0; j < chunkUploadedList.length; j++) {
            if (chunkItem.chunkNumber === chunkUploadedList[j]) {
                chunkList.splice(i, 1);
                break;
            }
        }
    }
    return chunkList;
};
const uploadChunkList = (chunkList: any[]): Promise<boolean> => {
    let successCount = state.currentFile.chunkUploadedList.length;
    const retryArr = [] as number[]; // 数组存储每个文件hash请求的重试次数，做累加 比如[1,0,2],就是第0个文件切片报错1次，第2个报错2次
    return new Promise((resolve: any) => {
        const handler = () => {
            if (chunkList.length) {
                if (!state.currentFile.chunkList.length) {
                    // 删除并取消上传
                    chunkList.length = 0;
                    resolve(true);
                }
                const chunkItem = chunkList.shift();
                const formdata = new FormData();
                formdata.append('md5', chunkItem.md5);
                formdata.append('file', chunkItem.file);
                formdata.append('fileName', chunkItem.filename);
                formdata.append('chunkNumber', chunkItem.chunkNumber);
                // 直接上传二进制，不需要构造 FormData，否则上传后文件损坏
                uploadHrAttachment(
                    formdata,
                    (p: any) => {
                        chunkItem.progress = parseInt(String((p.loaded / p.total) * 100));
                        updateChunkUploadStatus(chunkItem);
                    }
                ).then((uploadResult: any) => {
                    if (uploadResult) {
                        console.log('分片：' + chunkItem.chunkNumber + ' 上传成功');
                        successCount++;
                        // 继续上传下一个分片
                        handler();
                    } else {
                        // 更新状态
                        console.log('分片：' + chunkItem.chunkNumber + ' 上传失败，');
                        if (typeof retryArr[chunkItem.chunkNumber] !== 'number') {
                            retryArr[chunkItem.chunkNumber] = 0;
                        }
                        // 累加错误次数
                        retryArr[chunkItem.chunkNumber]++;
                        // 重试3次
                        if (retryArr[chunkItem.chunkNumber] >= chunkRetryCount) {
                            console.log(' 重试失败--- > handler -> retryArr', retryArr, chunkItem);
                            chunkList.length = 0;
                            state.currentFile.status = FileStatusMap.error;
                            return;
                        }
                        // 重新添加到队列中
                        chunkList.push(chunkItem);
                        handler();
                    }
                });
            }
            if (successCount >= state.totalChunks) {
                resolve(true);
            }
        };
        // 并发
        for (let i = 0; i < simultaneousUploads; i++) {
            handler();
        }
    });
};
// 分片上传文件
const handleUpload = async () => {
    // 1. 计算MD5
    const md5 = await getFileMd5(state.currentFile.raw) as string;
    if (!md5) return;
    // 2. 正在创建分片
    state.currentFile.chunkList = [];
    const fileChunks = createFileChunk(state.currentFile.raw, chunkSize);
    fileChunks.map((chunkItem, index) => {
        state.currentFile.chunkList.push({
            md5,
            chunkNumber: index + 1,
            filename: state.currentFile.name,
            file: chunkItem.file,
            progress: 0,
            status: {}
        });
    });
    // 3. 接口检查是否已上传，如已上传返回上传过的分片索引列表，若未上传过则返回null
    // 过滤已经上传的分片
    const uploadedResult = await checkFileUploadedByMd5({
        md5: md5,
        fileName: state.currentFile.name
    });
    if (uploadedResult.data?.presence) {
        state.currentFile.status = FileStatusMap.success;
        state.attachedUrl = uploadedResult.data.url;
        return;
    } else {
        // 获取已上传分片列表
        state.currentFile.chunkUploadedList = uploadedResult.data.uploaded;
    }
    state.currentFile.chunkList = filterUploadChunkList(state.currentFile.chunkList);
    let uploadResult = true;
    if (state.currentFile.chunkList.length === 0) { // 所有分片全部已上传，立即完成（秒传）
        state.currentFile.status = FileStatusMap.success;
        state.currentFile.percentage = 100;
    } else {
        // 4. 上传分片
        state.currentFile.status = FileStatusMap.uploading;
        uploadResult = await uploadChunkList(state.currentFile.chunkList);
    }
    if (!uploadResult) {
        // window.$message.error('文件上传失败');
        state.currentFile.status = FileStatusMap.error;
        return;
    }
    // 5. 接口获取文件路径
    await getAttachmentUrl({
        md5,
        fileName: state.currentFile.name,
        fileChunkNum: state.totalChunks
    }).then((res: any) => {
        const mergeResult = res.code === 200;
        if (!mergeResult) {
            // window.$message.error('获取文件路径失败');
            state.currentFile.status = FileStatusMap.error;
        } else {
            state.currentFile.status = FileStatusMap.success;
            state.attachedUrl = res.desc || '';
        }
    });
};
const onFileChange = (file: any) => {
    state.currentFile = file;
    if (file.size > maxSize) {
        // window.$message.error('文件大小不得超过100M');
        uploadRef.value.clearFiles();
    } else {
        handleUpload();
    }
};
const handleExceed = (files: any[]) => {
    uploadRef.value.clearFiles();
    const file = files[0];
    uploadRef.value.handleStart(file);
};
const handleDelete = () => {
    uploadRef.value.clearFiles();
    state.currentFile.chunkList = [];
    state.attachedUrl = '';
};
</script>

<style lang="less" scoped>

</style>
