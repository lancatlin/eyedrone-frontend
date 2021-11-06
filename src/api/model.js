import axios from "./axios";

export async function getModelList() {
  try {
    const res = await axios.get("/api/models/");
    return res.data;
  } catch (err) {
    throw err;
  }
}
