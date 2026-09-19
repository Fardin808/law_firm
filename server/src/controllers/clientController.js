import Client from "../models/Client.js";
import "../models/ClientAccount.js";
// ---------------------------------------
// Generate Client Code
// Example: CLI-0001
// ---------------------------------------

const generateClientCode = async () => {
  const lastClient = await Client.findOne()
    .sort({ createdAt: -1 })
    .select("clientCode");

  if (!lastClient) {
    return "CLI-0001";
  }

  const lastNumber =
    Number(lastClient.clientCode.split("-")[1]) || 0;

  const nextNumber = lastNumber + 1;

  return `CLI-${String(nextNumber).padStart(4, "0")}`;
};

// ---------------------------------------
// CREATE CLIENT
// ---------------------------------------

export const createClient = async (req, res) => {
  try {
    const {
      name,
      phone,
      email = "",
      isInactive = false,
    } = req.body;

    if (!name?.trim() || !phone?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Client name and phone are required.",
      });
    }

    if (email?.trim()) {
      const existingEmail = await Client.findOne({
        email: email.trim().toLowerCase(),
      });

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "A client with this email already exists.",
        });
      }
    }

    const clientCode = await generateClientCode();

    const client = await Client.create({
      clientCode,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      isInactive: Boolean(isInactive),
    });

    return res.status(201).json({
      success: true,
      message: "Client created successfully.",
      client,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------------------------------
// GET CLIENT LIST
// ---------------------------------------

export const getClients = async (req, res) => {
  try {
    const {
      clientCode,
      name,
      phone,
      status,
      limit = 10,
      page = 1,
    } = req.query;

    const filter = {};

    if (clientCode) {
      filter.clientCode = {
        $regex: clientCode,
        $options: "i",
      };
    }

    if (name) {
      filter.name = {
        $regex: name,
        $options: "i",
      };
    }

    if (phone) {
      filter.phone = {
        $regex: phone,
        $options: "i",
      };
    }

    if (status === "active") {
      filter.isInactive = false;
    }

    if (status === "inactive") {
      filter.isInactive = true;
    }

    const pageNumber = Math.max(
      Number(page) || 1,
      1
    );

    const pageSize = Math.max(
      Number(limit) || 10,
      1
    );

    const clients = await Client.find(filter)
      .populate("accountInfo")
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);

    const total = await Client.countDocuments(filter);

    return res.status(200).json({
      success: true,
      clients,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------------------------------
// GET ONE CLIENT
// ---------------------------------------

export const getClientById = async (req, res) => {
  try {
    const client = await Client.findById(
      req.params.id
    ).populate("accountInfo");

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found.",
      });
    }

    return res.status(200).json({
      success: true,
      client,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------------------------------
// UPDATE CLIENT
// ---------------------------------------

export const updateClient = async (req, res) => {
  try {
    const {
      name,
      phone,
      email = "",
      isInactive = false,
    } = req.body;

    if (!name?.trim() || !phone?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Client name and phone are required.",
      });
    }

    const client = await Client.findById(
      req.params.id
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found.",
      });
    }

    if (email?.trim()) {
      const existingEmail = await Client.findOne({
        email: email.trim().toLowerCase(),
        _id: {
          $ne: req.params.id,
        },
      });

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Another client already uses this email.",
        });
      }
    }

    client.name = name.trim();
    client.phone = phone.trim();
    client.email = email.trim().toLowerCase();
    client.isInactive = Boolean(isInactive);

    await client.save();

    return res.status(200).json({
      success: true,
      message: "Client updated successfully.",
      client,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------------------------------
// DELETE CLIENT
// ---------------------------------------

export const deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(
      req.params.id
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found.",
      });
    }

    await client.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Client deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};