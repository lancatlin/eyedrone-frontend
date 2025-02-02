import React, { useState } from "react";
import PrevPic from "../components/prev-pic";
import axios from "../api/axios";
import usePanelSelector from "../components/usePanelSelector";
import useModelSelector from "../components/useModelSelector";

function NewPredict() {
  //const [modelId, chModelId] = useState(1);
  const [allModel, chAllModel] = useState();
  const [imageId, changeImageId] = useState([]);
  const [predictDate, setPredictDate] = useState("");
  const [predictTime, setPredictTime] = useState("");
  const [previewImgUrl, chPreviewImgUrl] = useState([]);
  var [fileName, changeFileName] = useState([]);
  const [showCanvas, changeShowCanvas] = useState(false); //是否顯示圖片讓使用者標點
  const [group, changeGroup] = useState(0); //顯示的圖片組數
  const [totalGroup, changeTotalGroup] = useState(0); //總共的圖片組數
  const [showUploadBtn, setShowUploadBtn] = useState(false);
  const [panelName, chPanelName] = useState("");
  const [allPanel, chAllPanel] = useState([]);
  //const [panelId, chPanelId] = useState(1);

  const [isUploadingImg, chIsUploadingImg] = useState(false);
  const [isUploadingPre, chIsUploadingPre] = useState(false);

  const { panelId, isConfirmed, PanelSelector } = usePanelSelector();
  const { modelId, ModelSelector } = useModelSelector();

  let url = new URL(window.location.href);
  let id = url.searchParams.get("id");

  React.useEffect(() => {
    window.addEventListener("load", async () => {
      const res = await axios.get("/api/models/");
      const resImg = await axios.get("/api/images/");
      const resPanel = await axios.get("/api/panels/");
      chAllModel(res.data);
      chAllPanel(resPanel.data);
      console.log(res.data);
      console.log("images: ", resImg.data);
      console.log("panels: ", resPanel.data);
      if (id != null) {
        const res_predictData = await axios.get("/api/predicts/" + id);
        //chModelId(res_predictData.data.model);
        let allImgId = [];
        res_predictData.data.images.map((val, index) => {
          if (!allImgId.includes(val)) {
            allImgId.push(val);
          }
        });
        let panelImg = 0;
        resImg.data.map((val, index) => {
          if (allImgId.includes(val.id)) {
            panelImg = val.panel;
            return;
          }
        });
        if (panelImg !== 0) {
          allImgId = [panelImg, ...allImgId];
          //chPanelId(panelImg);
        }

        console.log("all image id: ", allImgId);
        changeImageId(allImgId);
        changeTotalGroup(allImgId.length);

        let previewImgUrlTemp = [];
        allImgId.map((val, index) => {
          if (index === 0) {
            previewImgUrlTemp = [
              ...previewImgUrlTemp,
              resPanel.data[val - 1].preview,
            ];
            console.log(resPanel.data[val - 1].preview);
          } else {
            previewImgUrlTemp = [
              ...previewImgUrlTemp,
              resImg.data[val - 1].rgb,
            ];
          }
        });

        chPreviewImgUrl(previewImgUrlTemp);

        let dateTime = res_predictData.data.created_at;
        setPredictDate(dateTime.split("T")[0]);
        setPredictTime(dateTime.split("T")[1].slice(0, -1));
        setShowUploadBtn(true);
      }
    });
  });

  function handlePredictDate(e) {
    setPredictDate(e.target.value);
  }

  function handlePredictTime(e) {
    setPredictTime(e.target.value);
  }

  function uploadFile(event) {
    //setShowUploadBtn(false);
    if (event.target.files.length !== 5) {
      alert("請上傳五張圖片");
      return;
    }
    let fileNameTemp = []; //先將fileName內的都清空
    for (let i = 0; i < event.target.files.length; i++) {
      //將所接收到的所有名稱
      let file = event.target.files[i];
      console.log(window.URL.createObjectURL(file));
      console.log(file.name);
      // fileNameTemp.push(URL.createObjectURL(event.target.files[i]))
      fileNameTemp.push(event.target.files[i]);
    }
    //changeTotalGroup(totalGroup + 1);
    //console.log("total group", totalGroup);
    postImg(fileNameTemp, imageId.length);
    changeFileName(
      [...fileName, fileNameTemp].sort((a, b) => {
        if (a.name < b.name) {
          return -1;
        }
        if (a.name > b.name) {
          return 1;
        }

        // names must be equal
        return 0;
      })
    ); //改變fileName的數值
  }

  function switchGroup() {
    //選取完點按下確認後觸發
    if (totalGroup + 1 < fileName.length) {
      //代表使用者在未點擊確認的情況下就再按一次選擇檔案
      //totalGroup從零開始，由於State異步更新，所以totalGroup需要加一才會為實際組數
      let fileNamePrompt = [];
      for (let i = 0; i < totalGroup; i++) {
        fileNamePrompt.push(fileName[i]);
      }
      fileNamePrompt.push(fileName[fileName.length - 1]);
      changeFileName(fileNamePrompt);
      console.log("+++++++++++++++++++++++++++++++++++++");
      console.log(fileNamePrompt);
    }
    console.log("totalGroup: ", totalGroup);
    if (totalGroup === 0) {
      //新增第一組圖片，直接將group和totalGroup令為1
      //若為編輯第一組圖片，則totalGroup不為0，所以不會進入
      //postImg(0);
      changeShowCanvas(false);
      setShowUploadBtn(true);
      changeGroup(1);
      changeTotalGroup(1);
      return;
    }
    setShowUploadBtn(true);
    console.log("fileName length", fileName.length);
    console.log("total group", totalGroup);
    if (fileName.length > totalGroup) {
      //代表新增一組圖片，而不是去編輯原本建立的圖片組
      //postImg(axis[axis.length - 1].group);
      //postImg(group);
    }
    changeShowCanvas(false);
    changeGroup(imageId.length);
    changeTotalGroup(imageId.length);
    console.log(group);
    console.log(fileName);
  }

  const postImg = async (fileNameTemp, imageIdLen) => {
    //post multiple image to backend
    setShowUploadBtn(false);
    //Step 1:取得state數據
    //Step 2:新增到JSON-Server數據庫中
    console.log("----------------------------------");
    console.log(fileNameTemp);
    let param = new FormData(); // 创建form对象
    //param.append('model', modelId);  // 通过append向form对象添加数据
    //param.append('is_panel', (groupNum === 0) ? true : false);
    param.append("name", fileNameTemp[0].name.split("_")[1]);
    param.append("panel", panelId);
    param.append("blue", fileNameTemp[0]);
    param.append("green", fileNameTemp[1]);
    param.append("red", fileNameTemp[2]);
    param.append("nir", fileNameTemp[3]);
    param.append("red_edge", fileNameTemp[4]);
    const config = {
      headers: {
        "content-type": "multipart/form-data",
      },
      timeout: 60000,
    };
    console.log("param: ", param);
    try {
      chIsUploadingImg(true);
      setShowUploadBtn(false);
      fetch(`http://127.0.0.1:8000/api/images/`, {
        method: "POST",
        body: param,
      })
        .then((response) => response.json())
        .then((json) => {
          chIsUploadingImg(false);
          changeShowCanvas(true);
          console.log(json);
          changeTotalGroup(imageId.length);
          changeGroup(imageId.length);
          changeImageId([...imageId, json.id]);
          console.log(json.rgb);
          chPreviewImgUrl([...previewImgUrl, json.rgb]);
        });
      console.log("sent image");
    } catch (e) {
      console.log(e);
    }
  };

  function showPrevPic(groupNum) {
    //按下先前編輯的圖片組
    setShowUploadBtn(false);
    changeGroup(groupNum - 1);
    console.log(groupNum);
    changeShowCanvas(true);
  }

  function delImg(groupNum) {
    if (groupNum - 1 === 0) {
      alert("第一組圖片為panel，無法刪除!");
      return;
    }
    // 要刪除的東西有: imageId,
    changeImageId(
      imageId.filter((val, index) => {
        return index !== groupNum - 1;
      })
    );

    chPreviewImgUrl(
      previewImgUrl.filter((val, index) => {
        return index !== groupNum - 1;
      })
    );

    changeGroup(group - 1);
    changeTotalGroup(totalGroup - 1);
    console.log(imageId[groupNum - 1]);
  }

  async function postPredict() {
    if (predictDate.length < 1 || predictTime < 1) {
      alert("請確認 日期 或 時間 是否為空?");
      return;
    }
    chIsUploadingPre(true);
    console.log(imageId);
    try {
      const payload = {
        model: modelId,
        created_at: `${predictDate}T${predictTime}:00Z`,
        images: imageId,
      };
      console.log("payload", payload);
      const res = await axios.post("/api/predicts/", payload, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 60000,
      });
      const id = res.data.id;
      window.location.href = `/predicts/${id}`;
    } catch (err) {
      console.log(err);
      alert("Something went wrong...");
      chIsUploadingPre(false);
    }
  }

  return (
    <div>
      <h1 className="big-title">填寫預測數據</h1>
      <form className="model-name-form">
        <label>日期: </label>
        <input
          type="date"
          name="name"
          id="model-name"
          value={predictDate}
          onChange={handlePredictDate}
          required
        ></input>
        <label style={{ marginLeft: "10px" }}>時間: </label>
        <input
          type="time"
          name="name"
          id="model-name"
          value={predictTime}
          onChange={handlePredictTime}
          required
        ></input>
        <ModelSelector />
      </form>

      <div className="upload-img-form-container">
        <PanelSelector />
      </div>
      <hr />

      <div className="upload-img-form-container">
        <h5 className="upload-img-form-label">上傳圖片：</h5>

        {imageId.map((val, index) =>
          index >= 0 ? (
            <PrevPic
              key={index}
              group={index + 1}
              onClick={showPrevPic}
              delImg={delImg}
            />
          ) : null
        )}
        <p
          className="hint"
          style={{ display: isUploadingImg ? "block" : "none" }}
        >
          圖片上傳中
        </p>

        <form id="upload-img-container">
          {" "}
          {/* */}
          {/* <button id="upload-img" onClick={handleClick}>上傳圖片</button> */}
          {/* <p>{fileName.toString()}</p> */}
          <input
            id="upload-img"
            type="file"
            onChange={uploadFile}
            multiple
            disabled={isUploadingImg || !isConfirmed}
            // imageId.length < 1 ? true : false
          />
          {/* ref用來讓button操作input時有依據 */}
        </form>
      </div>

      <div className="image-container">
        <img
          id="imgShow"
          src={previewImgUrl[group]}
          style={{
            objectFit: "contain",
            width: "100%",
            height: "100%",
            display: showCanvas ? "block" : "none",
          }}
        />
        <button
          className="button"
          style={{ display: showCanvas ? "block" : "none" }}
          onClick={switchGroup}
        >
          確認
        </button>
      </div>
      <br />
      <div className="center-button">
        <button
          className="upload-button"
          style={{ display: showUploadBtn === true ? "inline-block" : "none" }}
          onClick={postPredict}
        >
          {/* postPredict */}
          上傳
        </button>
      </div>
      <div
        className="popUp-background"
        style={{ display: isUploadingPre ? "block" : "none" }}
      >
        <div
          className="popUp"
          id="popUp"
          style={{ textAlign: "center", padding: "20px" }}
        >
          上傳預測資料中...
        </div>
      </div>
    </div>
  );
}

export default NewPredict;
