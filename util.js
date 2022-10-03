const express = require('express');
const {PrismaClient} = require('@prisma/client');
const bodyParser = require('body-parser');
var cors = require('cors')
const app = express();
const port = 3000;

// MODELOS Y SEPARAR EN SERVICIOS

// https://expressjs.com/en/resources/middleware/cors.html
app.use(cors())

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const fetch = (...args) =>
	import('node-fetch').then(({default: fetch}) => fetch(...args));


app.get('/', (req, res) => res.send('Hello World!'));


// get productos from heroku database using prisma
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

app.post('/login', async (req, res) => {
	const prisma = new PrismaClient();
	const {email, password} = req.body;
	try {
		const usuario = await prisma.usuarios.findUnique({
			where: {
				email: email
			}
		});
		if (usuario) {
			if (usuario.password === password) {
				res.status(200).json({mensaje: 'Login correcto', status: 200});
			} else {
				res.status(400).json({mensaje: 'Contraseña incorrecta', status: 400});
			}
		} else {
			res.status(400).json({mensaje: 'Usuario no encontrado', status: 400});
		}
	} catch (error) {
		res.status(400).json({mensaje: 'Error al realizar el login', status: 400});
	}
	// close prima connection
	prisma.$disconnect();
});

app.post('/usuario', async (req, res) => {
	const prisma = new PrismaClient();
	const usuario = req.body;
	try {
		const usuarioDB = await prisma.usuarios.findUnique({
			where: {
				email: usuario.email
			}
		});
		if (usuarioDB) {
			res.status(400).json({mensaje: 'El usuario ya existe', status: 400});
		} else {
			const usuarioNuevo = await prisma.usuarios.create({
				data: {
					email: usuario.email,
					password: usuario.password
				}
			});
			res.status(200).json({mensaje: 'Usuario creado con exito', status: 200});
		}
	} catch (error) {
		res.status(400).json({mensaje: 'Error al crear el usuario', status: 400});
	}
	// close prima connection
	prisma.$disconnect();
});

app.put('/usuario', async (req, res) => {
	const prisma = new PrismaClient();
	const usuario = req.body;
	try {
		const usuarioDB = await prisma.usuarios.findUnique({
			where: {
				email: usuario.email
			}
		});
		if (usuarioDB) {
			const usuarioActualizado = await prisma.usuarios.update({
				where: {
					email: usuario.email
	
				},
				data: {
					password: usuario.password
				}
			});
			res.status(200).json({mensaje: 'Usuario actualizado con exito', status: 200});
		} else {
			res.status(400).json({mensaje: 'El usuario no existe', status: 400});
		}
	} catch (error) {
		res.status(400).json({mensaje: 'Error al actualizar el usuario', status: 400});
	}
	// close prima connection
	prisma.$disconnect();
});

// logic delete using update and try catch
app.delete('/usuario', async (req, res) => {
	const prisma = new PrismaClient();
	const usuario = req.body;
	try {
		const usuarioDB = await prisma.usuarios.findUnique({
			where: {
				email: usuario.email
			}
		});
		if (usuarioDB) {
			const usuarioActualizado = await prisma.usuarios.update({
				where: {
					email: usuario.email
	
				},
				data: {
					deleted: true
				}
			});
			res.status(200).json({mensaje: 'Usuario eliminado con exito', status: 200});
		} else {
			res.status(400).json({mensaje: 'El usuario no existe', status: 400});
		}
	} catch (error) {
		res.status(400).json({mensaje: 'Error al eliminar el usuario', status: 400});
	}
	// close prima connection
	prisma.$disconnect();
});

app.listen(port, () => console.log(`Example app listening on http://localhost:${port}`));