import React, { useState } from "react";
import { useQuery } from "react-query";
import { useParams } from "react-router-dom";
import axios from "../api/axios";
import Table from "react-bootstrap/Table";
import translate from "../components/translate";

async function getModelDetail(id) {
  const res = await axios.get(`/api/models/${id}/`);
  return res.data;
}

function format(n) {
  return Math.round(n * 100) / 100;
}

function percent(n) {
  return `${Math.round(n * 100)}%`;
}

function ModelDetail() {
  const { id } = useParams();
  const { data, isLoading, isError, error } = useQuery(
    ["model-detail", id],
    () => getModelDetail(id)
  );
  const [isShowStream, changeIsShowStream] = useState(false);

  if (isLoading) {
    return <p>正在載入模型...</p>;
  }
  if (isError) {
    console.log(error);
    return <p>發生錯誤</p>;
  }
  console.log(data);
  const substanceList = data.substances.map(({ name, formula, r2 }) => (
    <div key={name}>
      <h4>{translate[name]}</h4>
      <p>模型：{formula}</p>
      <p>R2：{format(r2)}</p>
    </div>
  ));

  const score = {
    do: 0,
    bod: 0,
    ss: 0,
    nh3n: 0,
    sum: 0,
  };

  const points = data.predictions.map(
    ({ do: do_val, bod, ss, nh3n, x, y }, index) => {
      const point = data.points[index];
      let err_do = Math.abs((point.do - do_val) / point.do);
      score.do += err_do;
      let err_bod = Math.abs((point.bod - bod) / point.bod);
      score.bod += err_bod;
      let err_ss = Math.abs((point.ss - ss) / point.ss);
      score.ss += err_ss;
      let err_nh3n = Math.abs((point.nh3n - nh3n) / point.nh3n);
      score.nh3n += err_nh3n;

      return (
        <tr>
          <td>
            {x}, {y}
          </td>
          <td>
            {data.points[index].do} / {format(do_val)} /{" "}
            {percent(do_val / point.do - 1)}
          </td>
          <td>
            {data.points[index].bod} / {format(bod)} /{" "}
            {percent(bod / point.bod - 1)}
          </td>
          <td>
            {data.points[index].ss} / {format(ss)} /{" "}
            {percent(ss / point.ss - 1)}
          </td>
          <td>
            {data.points[index].nh3n} / {format(nh3n)} /{" "}
            {percent(nh3n / point.nh3n - 1)}
          </td>
        </tr>
      );
    }
  );

  score.sum = (score.do + score.bod + score.ss + score.nh3n) / 4;
  const predictionTable = (
    <div align="center">
      <strong>實際值 / 預測值 / 誤差百分比</strong>
      <Table
        striped
        bordered
        hover
        style={{ tableLayout: "fixed", width: "70%" }}
      >
        <thead>
          <tr>
            <th>座標</th>
            <th>{translate["do"]}</th>
            <th>{translate["bod"]}</th>
            <th>{translate["ss"]}</th>
            <th>{translate["nh3n"]}</th>
          </tr>
        </thead>
        <tbody>
          {points}
          <tr>
            <td>平均</td>
            <td>{percent(score.do / data.predictions.length)}</td>
            <td>{percent(score.bod / data.predictions.length)}</td>
            <td>{percent(score.ss / data.predictions.length)}</td>
            <td>{percent(score.nh3n / data.predictions.length)}</td>
          </tr>
        </tbody>
      </Table>
      <p>
        總誤差：<strong>{percent(score.sum / data.predictions.length)}</strong>
      </p>
    </div>
  );

  const predictions_btn = <button onClick={post_prdictions}>計算預測點</button>;

  async function post_prdictions() {
    console.log(id);
    const res = await axios.post(
      "/api/models/" + id + "/predictions/",
      {},
      { timeout: 60000 }
    );
    window.location.reload();
  }

  const build_model_btn = <button onClick={build_model}>訓練模型</button>;

  async function build_model() {
    fetch(`http://127.0.0.1:8000/api/models/${id}/build/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.body)
      .then((rs) => {
        const reader = rs.getReader();
        return new ReadableStream({
          async start(controller) {
            changeIsShowStream(true);
            let streamTotalStr = [];
            while (true) {
              const { done, value } = await reader.read();

              // When no more data needs to be consumed, break the reading
              if (done) {
                changeIsShowStream(false);
                window.location.reload();
                break;
              }
              var enc = new TextDecoder("utf-8");
              const stringTxt = enc.decode(value).replace("<br>", "");
              console.log(stringTxt);
              document.getElementById("streaming").innerHTML +=
                "<p>" + stringTxt + "</p>";
              //streamTotalStr.push(stringTxt);
              // console.log(streamTotalStr);
              // changeStreamTxt(streamTotalStr);

              // Enqueue the next data chunk into our target stream
              controller.enqueue(value);
            }

            // Close the stream
            //history.push({ pathname: '/', state: res.data.id });
            controller.close();
            reader.releaseLock();
          },
        });
      });
  }

  return (
    <div>
      <h1>{data.name}</h1>
      <div>{predictions_btn}</div>
      <div>{build_model_btn}</div>
      <div>{substanceList}</div>
      <div>{predictionTable}</div>
      <div
        id="streaming"
        style={{ display: isShowStream ? "block" : "none" }}
      ></div>
    </div>
  );
}

export default ModelDetail;
