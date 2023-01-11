# Real-time Object Detection Web App
This project is a web-based application that utilizes real-time object detection to identify and label objects within an image or video stream. It is built using Next.js, ONNXRuntime, and YOLOv model.

## Demo at [ROTD.vercel.app](rtod.vercel.app)
<div align="center" autoplay loop>
  <video src="https://user-images.githubusercontent.com/44163987/211734752-e354b590-0f55-465a-b783-504ed55d3ed3.mp4" alt="demo" />
</div>


## Getting Started
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites
In order to run this project, you will need to have the following software installed on your machine:

- Node.js
- A web browser 

### Installation
1. Clone the repository to your local machine:
```
https://github.com/juanjaho/real-time-object-detection-web-app.git
```

2. Navigate to the project directory:
```
cd real-time-object-detection-web-app
```

3. Install the necessary dependencies by running:
```
npm install
# or 
yarn install
```

4. Start the development server by running:
```
npm run dev
# or
yarn dev
```

5. Open your web browser and navigate to http://localhost:3000 to view the application.

### Installation as PWA

This app can also be installed on your device (desktop or mobile) as a progressive web app (PWA). Here's how:

1. Visit the app's URL in a web browser that supports PWAs (such as Google Chrome or Firefox).
2. Look for the "Install" or "Add to Homescreen" button in the browser's interface. 
3. Click the button and follow the prompts to install the app.
4. The app will now be installed on your device and can be launched from the homescreen like any other app.

### Deployment
This project can be deployed to a web server for public access. For more information on deploying a Next.js application, please visit the official [documentation](https://nextjs.org/docs/deployment/)


## Built With
- [ONNXRuntime](https://onnxruntime.ai/) - An open-source project for running inferences using pre-trained models in a variety of formats.
- [YOLOv7](https://github.com/WongKinYiu/yolov7) - A Object detection model which is used in this project.
- [Next.js](https://nextjs.org/) - A JavaScript framework for building server-rendered React applications.
- [PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) - A progressive web app that can be installed on a user's device and run offline, providing a native-like experience.

## Contributing
If you want to contribute to this project, please feel free to submit a pull request. Any contributions, big or small, are greatly appreciated!

## Authors
Juan Sebastian - Initial work - [@juanjaho](https://github.com/juanjaho)

## License
This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments
- Special thanks to [@WongKinYiu](https://github.com/WongKinYiu) for creating such an amazing [YOLOv7](https://github.com/WongKinYiu/yolov7) model.

- Hats off to the ONNXRuntime team for making such a powerful tool accessible to developers.

- Referenced [ONNXRuntime Web Demo](https://github.com/microsoft/onnxruntime-web-demo) for guidance on how to use ONNXRuntime in a web application.

- Thank you to all the contributors to the open-source libraries used in this project.

- Inspiration for this project was taken from my previous project [AnimeArcaneGAN_Mobile](https://github.com/juanjaho/AnimeArcaneGAN_Mobile)

## Citation for YOLOv7
```
@article{wang2022yolov7,
  title={{YOLOv7}: Trainable bag-of-freebies sets new state-of-the-art for real-time object detectors},
  author={Wang, Chien-Yao and Bochkovskiy, Alexey and Liao, Hong-Yuan Mark},
  journal={arXiv preprint arXiv:2207.02696},
  year={2022}
}
```
