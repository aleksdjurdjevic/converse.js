import { __ } from '@converse/headless/i18n';
import { api } from "@converse/headless/converse-core";
import { html } from "lit-html";

const i18n_hidden_message = __('Hidden message');
const i18n_message = __('Message');
const i18n_send_message = __('Send the message');
const i18n_spoiler_hint = __('Optional hint');
const i18n_unread_msgs = __('You have unread messages');


export default (o) =>  {
    const show_send_button = api.settings.get('show_send_button');
    const show_toolbar = api.settings.get('show_toolbar');
    return html`
        ${ o.show_new_msgs_indicator ? html`<div class="new-msgs-indicator" @click=${o.scrollDown}>▼ ${ i18n_unread_msgs } ▼</div>` : '' }
        <form class="setNicknameButtonForm hidden">
            <input type="submit" class="btn btn-primary" name="join" value="Join"/>
        </form>
        <form class="sendXMPPMessage">
            ${ (show_toolbar || show_send_button) ? html`
                <div class="chat-toolbar--container">
                    ${ show_toolbar ? html`<ul class="chat-toolbar no-text-select"></ul>` : '' }
                    ${ show_send_button ? html`<button type="submit" class="btn send-button fa fa-paper-plane" title="${ i18n_send_message }"></button>` : '' }
                </div>` : ''
            }
            <input type="text"
                   placeholder="${i18n_spoiler_hint || ''}"
                   value="${o.hint_value || ''}"
                   class="${o.composing_spoiler ? '' : 'hidden'} spoiler-hint"/>

            <div class="suggestion-box">
                <textarea
                    @dragover=${o.onDragOver}
                    @drop=${o.onDrop}
                    @input=${o.inputChanged}
                    @keydown=${o.onKeyDown}
                    @keyup=${o.onKeyUp}
                    @paste=${o.onPaste}
                    type="text"
                    class="chat-textarea suggestion-box__input
                        ${ show_send_button ? 'chat-textarea-send-button' : '' }
                        ${ o.composing_spoile ? 'spoiler' : '' }"
                    placeholder="${o.composing_spoiler ? i18n_hidden_message : i18n_message}">${ o.message_value || '' }</textarea>
                <span class="suggestion-box__additions visually-hidden" role="status" aria-live="assertive" aria-relevant="additions"></span>
            </div>
        </form>`;
}
