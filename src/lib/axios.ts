import axios from "axios";

const api = axios.create({
  baseURL: "https://psychic-lamp-r49rp79474pr2xjq5-3000.app.github.dev/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
