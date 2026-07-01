import axios from "axios";

const gifApi = axios.create({
    baseURL: "https://api.klipy.com",
});

export default gifApi;