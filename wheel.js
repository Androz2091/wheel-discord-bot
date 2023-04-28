const { join } = require('path');
const { Canvas, createCanvas, loadImage, registerFont } = require('canvas');
// @ts-ignore
const GIFEncoder = require("gif-encoder-2");

registerFont(join(__dirname, "assets", "Poppins", "Poppins-Bold.ttf"), {
    family: "PoppinsBold",
});

registerFont(join(__dirname, "assets", "Poppins", "Poppins-Regular.ttf"), {
    family: "PoppinsReg",
});

module.exports.createSpinWheel = async (
    data,
    returnCanvas
) => {
    const canvas = createCanvas(500, 500);
    const ctx = canvas.getContext("2d");

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 200;

    // Draw the circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = "black";
    ctx.stroke();

    // this is the angle for each item
    const angle = (2 * Math.PI) / data.length;

    const winnerItem = data.find((i) => i.winner);
    const beforeArray = data.slice(0, data.indexOf(winnerItem));
    const afterArray = data.slice(data.indexOf(winnerItem) + 1);
    data = [winnerItem, ...afterArray, ...beforeArray];

    let startAngle = -angle/2;
    let endAngle = startAngle + angle;
    for (let i = 0; i < data.length; i++) {
        const { color, label } = data[i];

        // Draw the wedge
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle, false);
        ctx.fillStyle = color;
        ctx.fill();

        // Draw the line
        ctx.lineWidth = 5;
        ctx.strokeStyle = "white";
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle, false);
        ctx.stroke();

        // Draw the last line
        if (i === data.length - 1) {
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, endAngle, endAngle + 0.01, false);
            ctx.stroke();
        }

        // Draw the text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + angle / 2);
        //get rgm from hex color
        const [r, g, b] = color
            .substring(1)
            .match(/.{2}/g)
            ?.map((x) => parseInt(x, 16));
        if (r * 0.299 + g * 0.587 + b * 0.114 > 186) {
            ctx.fillStyle = "black";
        } else ctx.fillStyle = "white";
        ctx.font = "23px PoppinsBold";
        let textWidth = ctx.measureText(label).width;
        while (textWidth > radius * 0.65) {
            ctx.font = `${parseInt(ctx.font) - 1}px PoppinsBold`;
            textWidth = ctx.measureText(label).width;
        }
        ctx.fillText(label, radius / 3, 10);
        ctx.restore();

        // Update the angles
        startAngle = endAngle;
        endAngle = startAngle + angle;
        console.log(`start: ${startAngle} end: ${endAngle}`)
    }

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, 50, 0, 2 * Math.PI, false);
    ctx.fillStyle = "black";
    ctx.fill();

    // Draw the play button
    const playbutton = await loadImage(
        join(__dirname, "assets", "logo.png")
    );
    ctx.drawImage(playbutton, centerX - 35, centerY - 35, 70, 70);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "white";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 50, 0, 2 * Math.PI, false);
    ctx.stroke();

    if (returnCanvas) return canvas;

    return canvas.toBuffer("image/png");
};

module.exports.createGIF = async (data) => {

    let winnerIndex = data.findIndex((i) => i.winner);
    const winner = data[winnerIndex];
    const itemsBeforeWinner = data.slice(0, winnerIndex);
    const itemsAfterWinner = data.slice(winnerIndex + 1);
    
    const items = [winner, ...itemsAfterWinner, ...itemsBeforeWinner];

    const spinwheel = await module.exports.createSpinWheel(items, true);

    const canvas = createCanvas(500, 500);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 500, 500);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const encoder = new GIFEncoder(500, 500, "octree", true);
    encoder.start();
    encoder.setRepeat(0);
    encoder.setQuality(10);
    encoder.setThreshold(30);

    encoder.setFrameRate(60);

    const playbutton = await loadImage(
        join(__dirname, "assets", "logo.png")
    );
    const pointer = await loadImage(
        join(__dirname, "assets", "pointer.png")
    );

    const drawWheel = async (angleInDegree, i) => {

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((angleInDegree * Math.PI) / 180);
        ctx.drawImage(spinwheel, -centerX, -centerY, 500, 500);
        ctx.restore();

        // Draw the play button
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, 50, 0, 2 * Math.PI, false);
        ctx.fillStyle = "black";
        ctx.fill();

        // Draw the play button
        const playbutton = await loadImage(
            join(__dirname, "assets", "logo.png")
        );
        ctx.drawImage(playbutton, centerX - 35, centerY - 35, 70, 70);
        ctx.lineWidth = 5;
        ctx.strokeStyle = "white";
        ctx.beginPath();
        ctx.arc(centerX, centerY, 50, 0, 2 * Math.PI, false);
        ctx.stroke();

        // write text at bottom right
        ctx.font = '20px PoppinsReg';
        ctx.fillStyle = "white";
        ctx.fillText("mycpcchat.com", 325, 480);

        // Draw the pointer
        ctx.save();
        ctx.translate(250, 250);
        ctx.rotate(Math.PI/2);
        ctx.drawImage(pointer, -25, -240, 50, 50);
        ctx.restore();

    };

    let rotationAngleInDegree = 0;
    let rotationAngleIncreaseInDegree = 0.01;

    let rotation = 0;
    const rotationTotal = 200;

    const segment_size = 360 / data.length;
    let winner_angle =
        360 * 2 - (data.length <= 5 ? segment_size / 2 : segment_size);
    // const random = Math.random() * 0.2;
    // winner_angle += random * segment_size;
    console.log(data);
    console.log(`Winner Angle: ${winner_angle}`);
    let i = 0;
    while (rotationTotal > rotation) {
        i += 1;
        console.log(
            `Frame ${i}`.padEnd(10),
            "|",
            `Angle: ${rotationAngleInDegree}`.padEnd(27),
            "|",
            `Angle Inc: ${rotationAngleIncreaseInDegree}`
        );

        await drawWheel(rotationAngleInDegree);
        encoder.addFrame(ctx);

        rotationAngleInDegree += rotationAngleIncreaseInDegree;
        rotationAngleIncreaseInDegree *= 1.1;

        rotation++;
    }
    encoder.setDelay(3000);
    encoder.addFrame(ctx);

    encoder.finish();
    const buffer = encoder.out.getData();

    const reversedBuffer = await gifken.reverse(buffer);
    return reversedBuffer;
}
