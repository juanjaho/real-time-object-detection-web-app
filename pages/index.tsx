import Head from "next/head";
import Image from "next/image";
import { Inter } from "@next/font/google";
import styles from "../styles/Home.module.css";
import ObjectDetectionCamera from "../components/ObjectDetectionCamera";

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
      <main className={styles.main}>
        <h2 className={styles.title} >Real-Time Object Detection</h2>
        <ObjectDetectionCamera width={640} height={480} />        
        <p className={styles.footer}>
          Created by <a href="https://juanjaho.github.io/">juanjaho</a>
        </p>
      </main>
    </>
  );
}
