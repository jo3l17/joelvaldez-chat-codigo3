"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = __importDefault(require("socket.io"));
const clientes_1 = require("./clientes");
const cliente_1 = require("./cliente");
class Server {
    constructor() {
        this.clientes = new clientes_1.Clientes();
        this.app = express_1.default();
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
            res.header('Access-Control-Allow-Headers', 'Content-type,Authorization');
            res.header('Access-Control-Allow-Methods', 'GET,POST');
            res.header('Allow', 'GET,POST');
            next();
        });
        this.httpServer = new http_1.default.Server(this.app);
        this.io = socket_io_1.default(this.httpServer);
        this.puerto = process.env.PORT || 3700;
        this.configurarBodyParser();
        this.asignarRutas();
        this.escucharSockets();
    }
    configurarBodyParser() {
        var bodyParser = require('body-parser');
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use(bodyParser.json());
    }
    escucharSockets() {
        console.log("Ecuchando los sockets");
        this.io.on('connect', (cliente) => {
            console.log("Uy!, alguien se conecto");
            console.log(cliente.id);
            let objCliente = new cliente_1.Cliente(cliente.id);
            this.clientes.add(objCliente);
            console.log("nueva lista de conectados");
            console.log(this.clientes.getClientes());
            cliente.on('disconnect', () => {
                console.log(`el cliente ${cliente.id} se desconecto`);
                this.clientes.remove(cliente.id);
                this.io.emit('retorno-usuarios', this.clientes.getClientes());
            });
            cliente.on('configurar-usuario', (data) => {
                let objCliente = new cliente_1.Cliente(cliente.id);
                objCliente.nombre = data;
                this.clientes.update(objCliente);
                console.log("nueva lista de conectados");
                console.log(this.clientes.getClientes());
                this.io.emit('retorno-usuarios', this.clientes.getClientes());
            });
            cliente.on('lista-usuarios', () => {
                this.io.emit('retorno-usuarios', this.clientes.getClientes());
            });
            cliente.on('enviar-mensaje', (mensaje) => {
                let objCliente = this.clientes.getNombreById(cliente.id);
                let content = {
                    mensaje: mensaje,
                    nombre: objCliente.nombre
                };
                this.io.emit('nuevo-mensaje', content);
            });
        });
    }
    asignarRutas() {
        
        this.app.get('/',(req,res)=>{
            res.send("buenas");
        });
        this.app.post('/enviar-mensaje', (req, res) => {
            let { para, mensaje, de } = req.body;
            let content = {
                mensaje: mensaje,
                nombre: de
            };
            this.io.to(para).emit('nuevo-mensaje', content);
            res.status(200).send('');
            // cuando el cliente quiere emitir un evento
            // a todos los clientes
            // Cliente.broadcast.emit('evento',content);
        });
    }
    start() {
        this.httpServer.listen(this.puerto, () => {
            console.log("servidor corriendo exitosamente en el puerto " + this.puerto);
        });
    }
}
exports.default = Server;
