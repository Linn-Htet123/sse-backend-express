import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3001;

interface ClientType {
  id: number;
  res: Response;
}

interface StockProductType {
  id: number;
  name: string;
  stock: number;
  price: number;
  previousPrice: number;
}

const clients: ClientType[] = [];
let stockProducts: StockProductType[] = [
  { id: 1, name: "Product A", stock: 100, price: 50, previousPrice: 50 },
  { id: 2, name: "Product B", stock: 200, price: 30, previousPrice: 30 },
  { id: 3, name: "Product C", stock: 150, price: 70, previousPrice: 70 },
];

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function updateStockProducts() {
  stockProducts = stockProducts.map((product) => {
    const newPrice = product.price + (Math.random() > 0.5 ? 5 : -5);
    return {
      ...product,
      stock: Math.max(0, product.stock - Math.floor(Math.random() * 10)),
      previousPrice: product.price,
      price: Math.max(0, newPrice),
    };
  });
}

function sendStockUpdatesToAll() {
  clients.forEach((client) => {
    client.res.write(`data: ${JSON.stringify(stockProducts)}\n\n`);
  });
}
function eventsHandler(req: Request, res: Response) {
  const headers = {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  };
  res.writeHead(200, headers);

  const clientID = Date.now();

  clients.push({
    id: clientID,
    res,
  });

  req.on("close", () => {
    console.log(`${clientID} Connection closed`);
    clients.splice(
      clients.findIndex((client) => client.id === clientID),
      1
    );
  });
}

setInterval(() => {
  updateStockProducts(); // Simulate stock update
  sendStockUpdatesToAll(); // Send update to all clients
}, 2000);

app.get("/events", eventsHandler);

app.get("/status", (req, res) => {
  res.send({ clients: clients.length });
});

app.get("/", (req, res) => {
  res.send({ message: "API works" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
