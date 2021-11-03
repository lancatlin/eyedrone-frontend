import React, { useState } from "react";
import { useQuery } from "react-query";
import { useParams } from "react-router-dom";
import axios from "../components/axios";
import Table from "react-bootstrap/Table";

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
      <h3>{name}</h3>
      <p>公式：{formula}</p>
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
            {data.points[index].do} / {format(do_val)}
          </td>
          <td>
            {data.points[index].bod} / {format(bod)}
          </td>
          <td>
            {data.points[index].ss} / {format(ss)}
          </td>
          <td>
            {data.points[index].nh3n} / {format(nh3n)}
          </td>
          <td>{percent((err_do + err_bod + err_ss + err_nh3n) / 4)}</td>
        </tr>
      );
    }
  );

  score.sum = (score.do + score.bod + score.ss + score.nh3n) / 4;
  const predictionTable = (
    <div>
      <Table
        striped
        bordered
        hover
        style={{ tableLayout: "fixed", width: "70%" }}
      >
        <thead>
          <tr>
            <th>實際值 / 預測值 </th>
            <th>do</th>
            <th>bod</th>
            <th>ss</th>
            <th>nh3n</th>
            <th>平均誤差</th>
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
            <td>{percent(score.sum / data.predictions.length)}</td>
          </tr>
        </tbody>
      </Table>
    </div>
  );

  const predictions_btn = (
    <button onClick={post_prdictions}>predictions</button>
  );

  async function post_prdictions() {
    console.log(id);
    const res = await axios.post(
      "/api/models/" + id + "/predictions/",
      {},
      { timeout: 60000 }
    );
    window.location.reload();
  }

  const build_model_btn = <button onClick={build_model}>build</button>;

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
      <div>{substanceList}</div>
      <div>{predictionTable}</div>
      <div>{predictions_btn}</div>
      <div>{build_model_btn}</div>
      <div
        id="streaming"
        style={{ display: isShowStream ? "block" : "none" }}
      ></div>
    </div>
  );
}

export default ModelDetail;
