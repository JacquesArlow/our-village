import { receiveYocoWebhook } from "../../../utils/yoco-webhook";

export default defineEventHandler((event) => receiveYocoWebhook(event, "test"));
