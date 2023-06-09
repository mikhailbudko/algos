import React, { useEffect, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import 'bootstrap/dist/css/bootstrap.min.css';


interface Point {
    x: number;
    y: number;
}

interface Line {
  slope: number;
  intercept: number;
}

const POINT_DISTANCE_THRESHOLD = 15;
const SLOPE_THRESHOLD = 0.0001;
const INTERCEPT_THRESHOLD = 0.0001;
const MAX_ITERATIONS = 1000;

function LinearRegression() {

    const [line, setLine] = useState<Line>({slope:1, intercept:0});
    const [redLine, setRedLine] = useState({x: 0, yActual: 0});
    const [learningRateIntercept, setLearningRateIntercept] = useState(0.25);
    const [learningRateSlope, setLearningRateSlope] = useState(0.000011);
    const [lastPoint, setLastPoint] = useState<Point>({x: -1,y: -1});
    const [shouldRun, setShouldRun] = useState(false);
    const [dragging, setDragging] = useState<boolean>(false);
    const [points, setPoints] = useState<Point[]>([]);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    function handleClick(event: React.MouseEvent<HTMLCanvasElement>) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = canvas.height - (event.clientY - rect.top);
        setPoints([...points, { x, y }]);
      }
    }

    function wait(ms: number) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    const setRedLine2 = (x: number, y:number): Promise<void> => {
      return new Promise(resolve => {
        setTimeout(() => {
          setRedLine({x: x, yActual: y});
          resolve();
        }, 10);
      });
    };

    function clearPoints() {
      if (!shouldRun) {
        setPoints([]);
        setLastPoint({x: -1,y: -1});
        setLine({slope:1, intercept:0});
      }
    }

    const handleMouseDown = (event: any) => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left);
      const y = canvas.height - (event.clientY - rect.top);
      setPoints((prevPoints) => [...prevPoints, { x, y }]);
      setLastPoint({x, y});
      setDragging(true);
    };
  
    function handleMouseMove(event: any) {
      const canvas = canvasRef.current!;
      if (dragging && canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = canvas.height - (event.clientY - rect.top);
        const distance = Math.sqrt((x - lastPoint.x) ** 2 + (y- lastPoint.y) ** 2);

        if (distance >= POINT_DISTANCE_THRESHOLD) {
            setPoints((points) => [...points, { x, y }]);
            setLastPoint({x, y});
        }
      }
    }
  
    const handleMouseUp = (event: any) => {
      setDragging(false);
    };

    function handleStart() {
      setShouldRun(true);
      runAlgo();

    }
    
    async function runAlgo() {
      let iteration = 0;

      let dSlope = 0;
      let dIntercept = 0;
      let slopeChange = 999;
      let interceptChange = 999;
    
      while (!((slopeChange < SLOPE_THRESHOLD && interceptChange < INTERCEPT_THRESHOLD) || iteration > 100)) {
        iteration++;

        for (let i = 0; i < points.length; i++) {
          const point = points.at(i);
          if (point) {
            dIntercept += (point.x * line.slope + line.intercept) - point.y;
            dSlope += ((point.x * line.slope + line.intercept) - point.y) * point.x;
            await setRedLine2(point.x, point.y);
          }
        }
        
        dSlope /=  points.length;
        dIntercept /=  points.length;   
        const newSlope = line.slope - learningRateSlope * dSlope;
        const newIntercept = line.intercept - learningRateIntercept * dIntercept;   
        slopeChange = Math.abs((newSlope - line.slope) / line.slope);
        interceptChange = Math.abs((newIntercept - line.intercept) / line.intercept);
        line.slope = newSlope;
        line.intercept = newIntercept;
        setLine({slope: newSlope, intercept: newIntercept});
        await wait(50);   // each iteration takes 50 ms
      }

      setShouldRun(false); // added this line
      console.log(slopeChange);
      console.log("done");
    }

    useEffect(() => {

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');

      let isDrawing = false;
      let lastX = 0;
      let lastY = 0;
  
      if (ctx && canvas) { // TODO: Make Canvas into React Component
        const rect = canvas.getBoundingClientRect();

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Undo previous translations
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Translate the context to the bottom left corner of the canvas
        ctx.translate(0, canvas.height);
        // Flip the y-axis to make positive y go up
        ctx.scale(1, -1);

        // Draw points
        points.forEach((point) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = 'green'; // TODO: random color for points
          ctx.fill();
        });
        // Set line properties
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = "blue";
        // Draw Line of Best Fit
        ctx.beginPath();
        const startX = 0;
        const startY = line.intercept;
        const endX = canvas.width;
        const endY = line.slope * (canvas.width) + line.intercept;
        ctx.moveTo(startX, startY); // reversed Y
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Draw Line of Prediction if Needed
        ctx.beginPath();
        ctx.moveTo(redLine.x, redLine.x * line.slope + line.intercept);
        ctx.lineTo(redLine.x, redLine.yActual);
        ctx.strokeStyle = 'red';
        ctx.stroke();

      }
    }, [points, line, redLine]);

    // useEffect(() => {
    //   if (shouldRun) {
    //     runAlgo();
    //   }
    // }, [shouldRun]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1>Linear Regression</h1>
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                style={{ border: '1px solid black', margin: 'auto' }}
                width={400}
                height={400}
            />
            <Button style={{marginTop: '10px',marginBottom: '10px', marginLeft: '45%', width: '10%'}} onClick={handleStart}variant="primary">Start</Button>{' '}
            <Button style={{marginTop: '10px',marginBottom: '10px', marginLeft: '45%', width: '10%'}} onClick={clearPoints}variant="info">Clear</Button>{' '}
            <div>
                <p> ALL TOGGLES AND BUTTONS HERE</p>
            </div>
        </div>
    );
}

export default LinearRegression;