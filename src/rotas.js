const { Router } = require("express");
const rota = Router();
const controlador = require("./controladores/pontos");

rota.get("/contas", controlador.listarContas);
rota.post("/contas", controlador.criarConta);
rota.put("/contas/:numeroConta/usuario", controlador.atualizarConta);
rota.delete("/contas/:numeroConta", controlador.deletarConta);
rota.post("/transacoes/depositar", controlador.depositar);
rota.post("/transacoes/sacar", controlador.sacar);
rota.post("/transacoes/transferir", controlador.transferencia);
rota.get("/contas/saldo", controlador.saldo);
rota.get("/contas/extrato", controlador.extrato);

module.exports = rota;
