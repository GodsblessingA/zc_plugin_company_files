const uuid = require("uuid").v4;
const FolderSchema = require("../models/Folder.js");
const appResponse = require("../utils/appResponse");
const DatabaseConnection = require("../utils/database.helper");
const RealTime = require("../utils/realtime.helper");
const { NotFoundError } = require("../utils/appError");

const Folders = new DatabaseConnection("Folder");

exports.folderCreate = async (req, res) => {
  const { body } = req;
  body.folderId = uuid();
  body.parentId = uuid();

  const folder = await FolderSchema.validateAsync(body);
  const response = await Folders.create(folder);

  res
    .status(201)
    .send(appResponse("Folder successfully created!", response, true));
};

exports.getAllFolders = async (req, res) => {
  const { data } = await Folders.fetchAll();
  const response = await RealTime.publish("all_folders", data);
  // res
  //   .status(200)
  //   .send(appResponse(null, { ...response }, true, { count: response.length }));
  res.status(200).send(
    appResponse("All folders", data, true, response, {
      count: data.length,
    })
  );
};

exports.folderDetails = async (req, res) => {
  const { folderId } = req.params;
  const { data } = await Folders.fetchOne({ folderId });

  if (data === null) {
    throw new NotFoundError();
  } else {
    const response = await RealTime.publish("folder_detail", data);
    res.status(200).send(appResponse("folder found", data, true, response));
  }

  // res.status(200).send(appResponse(null, { ...response }, true));
};

exports.folderUpdate = async (req, res) => {
  const { body } = req;

  const response = await Folders.update(req.params.id, body);
  const allFolders = await Folders.fetchAll();

  const updatedFolder = allFolders.data.filter((folder) => {
    return folder._id === req.params.id;
  });

  res.status(200).send(appResponse(null, updatedFolder, true));
};

exports.folderDelete = async (req, res) => {
  const { id } = req.params;

  //fetch all folders
  const folders = await Folders.fetchAll();

  //fetch a folder
  const folder = folders.data.filter((item) => item._id == id);

  //check to see if folder exists
  if (!folder.length) {
    return res
      .status(404)
      .json({ error: "folder with the given ID not found!" });
  }

  const response = await Folders.delete(id);

  res.status(200).send(appResponse(null, response, true));
};
