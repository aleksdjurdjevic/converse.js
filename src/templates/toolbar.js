import { html } from "lit-html";

export default (o) => html`
    <converse-chat-toolbar
        .chatview=${o.chatview}
        .model=${o.model}
        ?hidden_occupants="${o.hidden_occupants}"
        ?is_groupchat="${o.is_groupchat}"
        ?show_call_button="${o.show_call_button}"
        ?show_emoji_button="${o.show_emoji_button}"
        ?show_occupants_toggle="${o.show_occupants_toggle}"
        ?show_spoiler_button="${o.show_spoiler_button}"
        message_limit="${o.message_limit}"
    ></converse-chat-toolbar>
`;
