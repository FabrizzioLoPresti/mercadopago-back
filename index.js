const express = require('express');
const {PrismaClient} = require('@prisma/client');
const bodyParser = require('body-parser');
var cors = require('cors')
const app = express();
const port = process.env.PORT || 3000;

app.use(cors())

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => res.send('Hello World!'));

// obtener productos de la base de datos
app.get('/productos', async (req, res) => {
  const prisma = new PrismaClient();
  const productos = await prisma.productos.findMany();
  res.send(productos);
});

app.post('/pagar', async (req, res) => {
	const prisma = new PrismaClient();
	const productos = req.body;
	let stock = true;

	const respuesta = async () => {
		if (stock) {
			res.status(200).json({mensaje: 'Compra realizada con exito', status: 200});
		} else {
			res.status(400).json({mensaje: 'No hay stock suficiente', status: 400});
		}
	}

	// descontar stock en la base de datos solo si hay stock disponible para la venta, luego del post a la base de datos enviar respuesta al cliente
	Promise.all(productos.map(async (producto) => {
		const productoDB = await prisma.productos.findUnique({
			where: {
				id: producto.id
			}
		});
		if (productoDB.stock < producto.cantidad) {
			stock = false;
		}
	})).then(() => {
		if (stock) {
			Promise.all(productos.map(async (producto) => {
				await prisma.productos.update({
					where: {
						id: producto.id
					},
					data: {
						stock: {
							decrement: producto.cantidad
						}
					}
				});
			})).then(() => {
				respuesta();
			});
		} else {
			respuesta();
		}
	});

	// close prima connection
	prisma.$disconnect();
});

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));