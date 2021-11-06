import React from "react";
import { useQuery } from "react-query";
import { useParams } from "react-router-dom";
import axios from "../api/axios";
import ResultDetail from "../components/ResultDetail";

async function getPredict(id) {
  const res = await axios.get(`/api/predicts/${id}/`);
  return res.data;
}

function PredictDetail() {
  const { id } = useParams();
  const { data, isLoading, isError, error } = useQuery(
    ["predict-detail", id],
    () => getPredict(id)
  );
  if (isLoading) {
    return <p>正在載入預測...</p>;
  }
  if (isError) {
    console.log(error);
    return <p>發生錯誤</p>;
  }
  console.log(data);
  const resultList = data.results.map((result, id) => (
    <div key={result.id}>
      <ResultDetail result={result} resultId={id} />
    </div>
  ));
  return (
    <div>
      <h2>水質模型：{data.model.name}</h2>
      <p>建立時間：{data.created_at}</p>
      <div>{resultList}</div>
    </div>
  );
}

export default PredictDetail;
