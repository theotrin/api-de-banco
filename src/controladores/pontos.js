const bancoDeDados = require("../bancodedados");

const listarContas = (req, res) => {
  const senha = req.query.senha_banco;

  if (senha !== bancoDeDados.banco.senha) {
    return res
      .status(401)
      .send({ mensagem: "A senha do banco informada é inválida!" });
  }

  res.status(200).send(bancoDeDados.contas);
};

const validarCpf = (documento) => {
  const cpf = bancoDeDados.contas.find((cpfAtual) => {
    return Number(cpfAtual.usuario.cpf) === Number(documento);
  });
  if (cpf !== undefined) {
    return "cpf_existente";
  } else {
    return "cpf_pronto";
  }
};

const validarEmail = (documento) => {
  const email = bancoDeDados.contas.find((emailAtual) => {
    return emailAtual.usuario.email === documento;
  });
  if (email !== undefined) {
    return "email_existente";
  } else {
    return "email_pronto";
  }
};

const validarNumeroDeConta = (documento) => {
  const numero = bancoDeDados.contas.find((contaAtual) => {
    return contaAtual.numero === Number(documento);
  });
  if (numero === undefined) {
    return "conta_inexistente";
  } else {
    return documento;
  }
};

const criarConta = (req, res) => {
  const { nome, cpf, data_nascimento, telefone, email, senha } = req.body;

  let numero = bancoDeDados.contas.length + 1;

  const cpfValidado = validarCpf(cpf);
  const emailValidado = validarEmail(email);

  if (cpfValidado === "cpf_existente") {
    return res.status(403).send({
      mensagem: "cpf já existente, tente outro ou vá na aba restaurar acesso",
    });
  }
  if (emailValidado === "email_existente") {
    return res.status(403).send({
      mensagem: "email já existente, tente outroou vá na aba restaurar acesso",
    });
  }

  if (!nome || !data_nascimento || !email || !cpf || !telefone || !senha) {
    res.status(422).send({
      mensagem: "todos as informações devem ser preenchidas",
    });
  }

  const novaConta = {
    numero,
    saldo: 0,
    usuario: {
      nome,
      cpf,
      data_nascimento,
      telefone,
      email,
      senha,
    },
  };

  bancoDeDados.contas.push(novaConta);

  res.status(201).send();
};

const atualizarConta = (req, res) => {
  const { nome, cpf, data_nascimento, telefone, email, senha } = req.body;

  if (!nome || !data_nascimento || !email || !cpf || !telefone || !senha) {
    res.status(422).send({
      mensagem: "todos as informações devem ser preenchidas",
    });
  }

  const { numeroConta } = req.params;

  const validarConta = validarNumeroDeConta(numeroConta);

  if (validarConta === "conta_inexistente") {
    return res.status(409).send({
      mensagem: "o numero da conta não existe",
    });
  }

  const conta = bancoDeDados.contas.find((cliente) => {
    return cliente.numero === Number(numeroConta);
  });

  const cpfValidado = validarCpf(cpf);

  if (cpfValidado === "cpf_existente") {
    return res.status(403).send({
      mensagem: "O CPF informado já existente cadastrado",
    });
  }

  const emailValidado = validarEmail(email);

  if (emailValidado === "email_existente") {
    return res.status(403).send({
      mensagem: "O email informado já existe cadastrado!",
    });
  }

  conta.usuario.nome = nome;
  conta.usuario.cpf = cpf;
  conta.usuario.data_nascimento = data_nascimento;
  conta.usuario.telefone = telefone;
  conta.usuario.email = email;
  conta.usuario.senha = senha;

  res.status(204).send();
};

const deletarConta = (req, res) => {
  const { numeroConta } = req.params;

  const validarConta = validarNumeroDeConta(numeroConta);

  if (validarConta === "conta_inexistente") {
    return res.status(409).send({
      mensagem: `a conta informada (${numero_conta}) não existe`,
    });
  }

  const conta = bancoDeDados.contas.find((cliente) => {
    return cliente.numero === Number(numeroConta);
  });

  if (conta.saldo > 0) {
    return res.status(400).send({
      mensagem: "A conta só pode ser removida se o saldo for zero!",
    });
  }

  const lugarParaSerRemovido = bancoDeDados.contas.findIndex((conta) => {
    return conta.numero === Number(numeroConta);
  });

  bancoDeDados.contas.splice(lugarParaSerRemovido, 1);

  res.status(204).send();
};

const depositar = (req, res) => {
  const { numero_conta, valor } = req.body;

  if (!numero_conta || !valor) {
    return res.status(400).send({
      mensagem: "O número da conta e o valor são obrigatórios!",
    });
  }

  const validarConta = validarNumeroDeConta(numero_conta);

  if (validarConta === "conta_inexistente") {
    return res.status(409).send({
      mensagem: `a conta informada (${numero_conta}) não existe`,
    });
  }

  if (valor < 1) {
    return res.status(400).send({
      mensagem: "valor de deposito invalido!",
    });
  }

  const conta = bancoDeDados.contas.find((cliente) => {
    return cliente.numero === Number(numero_conta);
  });

  conta.saldo += valor;

  const registro = {
    data: new Date(),
    numero_conta,
    valor,
  };

  bancoDeDados.depositos.push(registro);

  res.status(204).send();
};

const sacar = (req, res) => {
  const { numero_conta, valor, senha } = req.body;

  if (!numero_conta || !valor || !senha) {
    return res.status(400).send({
      mensagem: "Os campos:  conta,valor e senha são obrigatórios",
    });
  }

  const validarConta = validarNumeroDeConta(numero_conta);

  if (validarConta === "conta_inexistente") {
    return res.status(409).send({
      mensagem: `a conta informada (${numero_conta}) não existe`,
    });
  }

  if (valor < 1) {
    return res.status(400).send({
      mensagem: "valor de saque invalido!",
    });
  }

  const conta = bancoDeDados.contas.find((cliente) => {
    return cliente.numero === Number(numero_conta);
  });

  if (conta.usuario.senha !== senha) {
    return res.status(409).send({
      mensagem: "dados incorretos!",
    });
  }

  if (valor > conta.saldo) {
    return res.status(400).send({
      mensagem: "saldo da conta insuficiente",
    });
  }
  conta.saldo -= valor;

  const registro = {
    data: new Date(),
    numero_conta,
    valor,
  };

  bancoDeDados.saques.push(registro);

  res.status(204).send();
};

const transferencia = (req, res) => {
  const { numero_conta_origem, numero_conta_destino, valor, senha } = req.body;

  if (!numero_conta_destino || !numero_conta_origem || !valor || !senha) {
    res.status(400).send({
      mensagem: "todos os cambos devem ser preenchidos ",
    });
  }

  const validarContaOrigem = validarNumeroDeConta(numero_conta_origem);

  if (validarContaOrigem === "conta_inexistente") {
    return res.status(409).send({
      mensagem: `a conta de origem (${numero_conta}) não existe`,
    });
  }

  const validarContaDestino = validarNumeroDeConta(numero_conta_destino);

  if (validarContaDestino === "conta_inexistente") {
    return res.status(409).send({
      mensagem: `a conta de destino (${numero_conta}) não existe`,
    });
  }

  const contaOrigem = bancoDeDados.contas.find((cliente) => {
    return cliente.numero === Number(numero_conta_origem);
  });

  const contaDestino = bancoDeDados.contas.find((cliente) => {
    return cliente.numero === Number(numero_conta_destino);
  });

  if (contaOrigem.usuario.senha !== senha) {
    return res.status(409).send({
      mensagem: "dados incorretos!",
    });
  }

  if (valor > contaOrigem.saldo)
    return res.status(400).send({
      mensagem: "saldo da conta insuficiente para transferência",
    });

  contaOrigem.saldo -= valor;
  contaDestino.saldo += valor;

  const registro = {
    data: new Date(),
    numero_conta_origem,
    numero_conta_destino,
    valor,
  };

  bancoDeDados.transferencias.push(registro);

  res.status(204).send();
};

const saldo = (req, res) => {
  const { numero_conta, senha } = req.query;

  if (!numero_conta || !senha) {
    res.status(400).send({
      mensagem: "todos os cambos devem ser preenchidos ",
    });
  }

  const validarConta = validarNumeroDeConta(numero_conta);

  if (validarConta === "conta_inexistente") {
    return res.status(409).send({
      mensagem: `a conta de origem (${numero_conta}) não existe`,
    });
  }

  const conta = bancoDeDados.contas.find((cliente) => {
    return cliente.numero === Number(numero_conta);
  });

  if (conta.usuario.senha !== senha) {
    return res.status(409).send({
      mensagem: "dados incorretos!",
    });
  }

  res.status(200).send({
    saldo: conta.saldo,
  });
};

const extrato = (req, res) => {
  const { numero_conta, senha } = req.query;

  if (!numero_conta || !senha) {
    res.status(400).send({
      mensagem: "todos os cambos devem ser preenchidos ",
    });
  }

  const validarConta = validarNumeroDeConta(numero_conta);

  if (validarConta === "conta_inexistente") {
    return res.status(409).send({
      mensagem: `a conta de destino (${numero_conta}) não existe`,
    });
  }

  const conta = bancoDeDados.contas.find((cliente) => {
    return cliente.numero === Number(numero_conta);
  });

  if (conta.usuario.senha !== senha) {
    return res.status(409).send({
      mensagem: "dados incorretos!",
    });
  }

  const extratoSaque = bancoDeDados.saques.filter((saque) => {
    return Number(saque.numero_conta) === Number(numero_conta);
  });
  const extratoDeposito = bancoDeDados.depositos.filter((deposito) => {
    return Number(deposito.numero_conta) === Number(numero_conta);
  });
  const extratoTransferenciaEnviadas = bancoDeDados.transferencias.filter(
    (transferencia) => {
      return Number(transferencia.numero_conta_origem) === Number(numero_conta);
    }
  );
  const extratoTransferenciaRecebidas = bancoDeDados.transferencias.filter(
    (transferencia) => {
      return (
        Number(transferencia.numero_conta_destino) === Number(numero_conta)
      );
    }
  );

  const extrato = {
    saques: [],
    depositos: [],
    transferenciasEviadas: [],
    transferenciasRecebidas: [],
  };
  extrato.saques.push(extratoSaque);
  extrato.depositos.push(extratoDeposito);
  extrato.transferenciasEviadas.push(extratoTransferenciaEnviadas);
  extrato.transferenciasRecebidas.push(extratoTransferenciaRecebidas);

  res.status(200).send(extrato);
};

module.exports = {
  listarContas,
  criarConta,
  atualizarConta,
  deletarConta,
  depositar,
  sacar,
  transferencia,
  saldo,
  extrato,
};
