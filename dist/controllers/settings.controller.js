"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSettings = exports.getSettings = void 0;
const settings_model_1 = __importDefault(require("../models/settings.model"));
const getSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const settings = yield settings_model_1.default.find();
        res.status(200).json({ success: true, data: settings });
    }
    catch (error) {
        res
            .status(400)
            .json({ success: false, message: "error fetching settings" });
    }
});
exports.getSettings = getSettings;
const addSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { key, value } = req.body;
        if (!key || !value) {
            res
                .status(400)
                .json({ success: false, message: "Please provide key and value" });
            return;
        }
        const setting = new settings_model_1.default({
            key,
            value,
        });
        const newSetting = yield setting.save();
        res.status(201).json({ success: true, data: newSetting });
    }
    catch (error) {
        res
            .status(400)
            .json({ success: false, message: "error creating settings" });
    }
});
exports.addSettings = addSettings;
