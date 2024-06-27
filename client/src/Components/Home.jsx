import React, { useState } from "react";
import axios from "axios";
import { Document, Page, pdfjs } from "react-pdf";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
const Home = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [pdfTitle, setPdfTitle] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    setPdfFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPdfPreview(reader.result);
    };
    reader.readAsDataURL(file);

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const metadata = await pdf.getMetadata();
    console.log("metadata is" + JSON.stringify(metadata.info,null,4));
    setPdfTitle(JSON.stringify(metadata.info.Title) || "Untitled PDF");
  };

  const handleUpload = async () => {
    if (!pdfFile) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("pdf_file", pdfFile);
    try {
      const res = await axios.post("http://127.0.0.1:5000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log(res.data);
    } catch (error) {
      console.error("Error uploading PDF:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    try {
      const res = await axios.post(
        "http://127.0.0.1:5000/chat",
        { prompt: chatInput },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log(res.data);
      setChatResponse(res.data.response);
    } catch (error) {
      console.error("Error getting chat response:", error);
    }
  };

  return (
    <div className="bg-[#020902] min-h-screen flex flex-col justify-center items-center">
      <div className="text-center mb-4 pt-4">
        <h1 className="text-2xl md:text-3xl xl:text-2xl font-bold tracking-tight text-green-500">
          Ask<span className="text-gray-300">YourPDF</span>
        </h1>
      </div>

      <div className="rounded-xl bg-[#1F1F1F] w-11/12 md:w-2/4 p-6 flex flex-col justify-center items-center">
        <div className="text-white text-3xl text-center pt-4 mb-4">
          How can I help you today?
        </div>

        <div className="text-md text-[#9A9A9A] mt-4 flex justify-center items-center">
          <div className="p-3 text-justify">
            Upload any PDF and get instant answers to your questions with our
            PDF Chatbot. Once processed, you can interact with the document in a
            chat-like interface, receiving accurate and relevant responses to
            your queries.
          </div>
        </div>

        <div className="relative w-full max-w-xs bg-[#424242] shadow-md rounded-lg my-4 mb-8 p-2">
          <div className="p-4 flex flex-col items-center justify-center text-center cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 mb-4 fill-green-500 inline-block"
              viewBox="0 0 32 32"
            >
              <path
                d="M23.75 11.044a7.99 7.99 0 0 0-15.5-.009A8 8 0 0 0 9 27h3a1 1 0 0 0 0-2H9a6 6 0 0 1-.035-12 1.038 1.038 0 0 0 1.1-.854 5.991 5.991 0 0 1 11.862 0A1.08 1.08 0 0 0 23 13a6 6 0 0 1 0 12h-3a1 1 0 0 0 0 2h3a8 8 0 0 0 .75-15.956z"
                data-original="#000000"
              />
              <path
                d="M20.293 19.707a1 1 0 0 0 1.414-1.414l-5-5a1 1 0 0 0-1.414 0l-5 5a1 1 0 0 0 1.414 1.414L15 16.414V29a1 1 0 0 0 2 0V16.414z"
                data-original="#000000"
              />
            </svg>
            <h4 className="text-base font-medium text-white">
              Media type Selection
            </h4>
            <label
              htmlFor="chooseFile"
              className="text-green-500 text-base font-semibold cursor-pointer"
            >
              Upload your PDF
            </label>
            <input
              type="file"
              id="chooseFile"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={handleUpload}
              className="mt-4 px-4 py-2 bg-green-500 text-white rounded"
              disabled={loading}
            >
              {loading ? "Uploading..." : "Upload PDF"}
            </button>
          </div>
        </div>

        {pdfPreview && (
          <div className="w-full max-w-xs bg-white shadow-md rounded-lg mb-4 p-2 overflow-hidden">
            <Document
              file={pdfPreview}
              onLoadError={(error) =>
                console.error("Error loading PDF:", error)
              }
            >
              <Page pageNumber={1} width={120} />
            </Document>
            <div className="text-center text-gray-700 mt-2">{pdfTitle}</div>
          </div>
        )}

        <div className="w-full bg-white p-1 rounded-lg mb-2 flex justify-center items-center">
          <div className="flex justify-between items-center w-full px-2">
            <img className="h-10 w-10" src="/Images/gpt.svg" alt="GPT logo" />
            <input
              type="text"
              className="flex-grow mx-2 p-2 rounded border border-gray-300"
              placeholder="Enter your prompt..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button onClick={handleChat} className="h-10 w-10">
              <img src="/Images/gpt_arr.png" alt="Send icon" />
            </button>
          </div>
        </div>
        {chatResponse && (
          <div className="bg-gray-800 text-white p-4 rounded mt-4 w-full max-w-md">
            <p>{chatResponse}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
