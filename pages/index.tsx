import Head from "next/head";
import Yolo from "../components/models/Yolo";


export default function Home() {
  return (
    <>
      <Head>
        <title>Real Time Object Detection</title>
        <meta name="description" content="Created by juanjaho" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/icon2.png" />
      </Head>
      <main className="font-mono flex flex-col justify-center items-center  w-screen">
        <h1 className="m-5 text-xl font-bold">Real-Time Object Detection</h1>
        <Yolo  />
        <p className="m-5">
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
