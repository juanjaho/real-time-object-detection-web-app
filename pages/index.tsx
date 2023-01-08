import Head from "next/head";
import Image from "next/image";
import { Inter } from "@next/font/google";
import styles from "../styles/Home.module.css";
// import ObjectDetectionCamera from "../components/ObjectDetectionCamera";
import Yolo from "../components/models/Yolo";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <>
      <Head>
        <title>Real Time Object Detection</title>
        <meta name="description" content="Created by juanjaho" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="font-mono flex flex-col justify-center items-center h-screen w-screen">
        <h1 className="p-5 text-xl">Real-Time Object Detection</h1>
        <Yolo  width = {640} height = {640} />
        <p className="p-5">
          Created by{" "}
          <a
            className="underline underline-offset-1 hover:translate-y-1"
            href="https://juanjaho.github.io/"
          >
            @juanjaho
          </a>
        </p>
      </main>
    </>
  );
}
