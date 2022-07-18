import { AxiosResponse } from "axios";
/**
 * 下载文件
 * @param response
 * @returns
 */
export const downloadFile = (response: AxiosResponse) => {
    console.log("response.data.type:", response.data.type);
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onload = function () {
            try {
                console.log("result:", this.result);
                const jsonData = JSON.parse((this as any).result); // 成功 说明是普通对象数据
                if (jsonData?.code !== 200) {
                    Message.error(jsonData?.message ?? "请求失败");
                    reject(jsonData);
                }
            } catch (err) {
                // 解析成对象失败，说明是正常的文件流
                const blob = new Blob([response.data]);
                // 本地保存文件
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                const filename = response?.headers?.["content-disposition"]
                    ?.split("filename*=")?.[1]
                    ?.substr(7);
                link.setAttribute("download", decodeURI(filename));
                document.body.appendChild(link);
                link.click();
                resolve(response.data);
            }
        };
        fileReader.readAsText(response.data);
    });
};