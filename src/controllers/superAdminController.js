const Client = require("../models/Client");
const ClientUser = require("../models/ClientUser");
const Choreography = require("../models/Choreography");
const Event = require("../models/Event");
const Judge = require("../models/Judge");
const Score = require("../models/Score");

async function getDashboard(req, res, next) {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const [totalClients, activeClients, blockedClients, activeEventsToday] = await Promise.all([
      Client.countDocuments(),
      Client.countDocuments({ status: "ativo" }),
      Client.countDocuments({ status: "bloqueado" }),
      Event.countDocuments({
        status: "ativo",
        data: {
          $gte: todayStart,
          $lt: todayEnd
        }
      })
    ]);

    res.status(200).json({
      totalClients,
      activeClients,
      blockedClients,
      activeEventsToday
    });
  } catch (error) {
    next(error);
  }
}

async function listClients(req, res, next) {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    const clientUsers = await ClientUser.find({
      role: "admin",
      clientId: { $in: clients.map((client) => client._id) }
    }).sort({ createdAt: 1 });

    const usersMap = new Map(clientUsers.map((user) => [user.clientId.toString(), user]));

    res.status(200).json(
      clients.map((client) => {
        const adminUser = usersMap.get(client._id.toString());

        return {
          _id: client._id,
          nome_empresa: client.nome_empresa,
          nome_responsavel: client.nome_responsavel,
          email_login: adminUser ? adminUser.email : "",
          plano: client.plano,
          status: client.status,
          limite_eventos: client.limite_eventos,
          data_expiracao: client.data_expiracao,
          createdAt: client.createdAt,
          updatedAt: client.updatedAt
        };
      })
    );
  } catch (error) {
    next(error);
  }
}

async function createClient(req, res, next) {
  try {
    const {
      nome_empresa,
      nome_responsavel,
      email_login,
      senha_login,
      plano,
      limite_eventos,
      data_expiracao,
      status
    } = req.body;

    if (!nome_empresa || !nome_responsavel || !email_login || !senha_login) {
      const error = new Error("nome_empresa, nome_responsavel, email_login and senha_login are required");
      error.statusCode = 400;
      throw error;
    }

    const existingUser = await ClientUser.findOne({
      email: email_login.toLowerCase().trim()
    });

    if (existingUser) {
      const error = new Error("email_login already exists");
      error.statusCode = 409;
      throw error;
    }

    const client = await Client.create({
      nome_empresa,
      nome_responsavel,
      plano: plano || "basico",
      status: status || "ativo",
      limite_eventos: limite_eventos ?? 0,
      data_expiracao: data_expiracao || null
    });

    await ClientUser.create({
      clientId: client._id,
      nome: nome_responsavel,
      email: email_login,
      password: senha_login,
      role: "admin"
    });

    res.status(201).json({
      message: "Client created successfully",
      client
    });
  } catch (error) {
    next(error);
  }
}

async function updateClient(req, res, next) {
  try {
    const { id } = req.params;
    const {
      nome_empresa,
      nome_responsavel,
      email_login,
      senha_login,
      plano,
      limite_eventos,
      data_expiracao,
      status
    } = req.body;

    const client = await Client.findById(id);

    if (!client) {
      const error = new Error("Client not found");
      error.statusCode = 404;
      throw error;
    }

    if (nome_empresa !== undefined) {
      client.nome_empresa = nome_empresa;
    }

    if (nome_responsavel !== undefined) {
      client.nome_responsavel = nome_responsavel;
    }

    if (plano !== undefined) {
      client.plano = plano;
    }

    if (limite_eventos !== undefined) {
      client.limite_eventos = limite_eventos;
    }

    if (data_expiracao !== undefined) {
      client.data_expiracao = data_expiracao || null;
    }

    if (status !== undefined) {
      client.status = status;
    }

    await client.save();

    const adminUser = await ClientUser.findOne({
      clientId: client._id,
      role: "admin"
    });

    if (adminUser) {
      if (nome_responsavel !== undefined) {
        adminUser.nome = nome_responsavel;
      }

      if (email_login !== undefined) {
        const normalizedEmail = email_login.toLowerCase().trim();
        const duplicateUser = await ClientUser.findOne({
          email: normalizedEmail,
          _id: { $ne: adminUser._id }
        });

        if (duplicateUser) {
          const error = new Error("email_login already exists");
          error.statusCode = 409;
          throw error;
        }

        adminUser.email = normalizedEmail;
      }

      if (senha_login) {
        adminUser.password = senha_login;
      }

      await adminUser.save();
    }

    res.status(200).json({
      message: "Client updated successfully",
      client
    });
  } catch (error) {
    next(error);
  }
}

async function deleteClient(req, res, next) {
  try {
    const { id } = req.params;
    const client = await Client.findById(id);

    if (!client) {
      const error = new Error("Client not found");
      error.statusCode = 404;
      throw error;
    }

    await Promise.all([
      Client.deleteOne({ _id: id }),
      ClientUser.deleteMany({ clientId: id }),
      Event.deleteMany({ clientId: id }),
      Choreography.deleteMany({ clientId: id }),
      Judge.deleteMany({ clientId: id }),
      Score.deleteMany({ clientId: id })
    ]);

    res.status(200).json({
      message: "Client deleted successfully"
    });
  } catch (error) {
    next(error);
  }
}

async function toggleClientStatus(req, res, next) {
  try {
    const { id } = req.params;
    const client = await Client.findById(id);

    if (!client) {
      const error = new Error("Client not found");
      error.statusCode = 404;
      throw error;
    }

    client.status = client.status === "bloqueado" ? "ativo" : "bloqueado";
    await client.save();

    res.status(200).json({
      message: "Client status updated successfully",
      status: client.status
    });
  } catch (error) {
    next(error);
  }
}

async function getClientEvents(req, res, next) {
  try {
    const { id } = req.params;
    const client = await Client.findById(id);

    if (!client) {
      const error = new Error("Client not found");
      error.statusCode = 404;
      throw error;
    }

    const events = await Event.find({ clientId: id }).sort({ data: -1, createdAt: -1 });

    res.status(200).json({
      client: {
        _id: client._id,
        nome_empresa: client.nome_empresa,
        nome_responsavel: client.nome_responsavel,
        plano: client.plano,
        status: client.status
      },
      events
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createClient,
  deleteClient,
  getClientEvents,
  getDashboard,
  listClients,
  toggleClientStatus,
  updateClient
};
