import "./emoji-picker.js";
import { CustomElement } from './element.js';
import { __ } from '@converse/headless/i18n';
import { _converse, api, converse } from "@converse/headless/converse-core";
import { html } from 'lit-element';
import { until } from 'lit-html/directives/until.js';

const Strophe = converse.env.Strophe

const i18n_start_call = __('Start a call');
const i18n_show_occupants = __('Show occupants');
const i18n_hide_occupants = __('Hide occupants');
const i18n_chars_remaining = __('Message characters remaining');
const i18n_choose_file =  __('Choose a file to send')


export class ChatToolbar extends CustomElement {

    static get properties () {
        return {
            chatview: { type: Object }, // Used by getToolbarButtons hooks
            hidden_occupants: { type: Boolean },
            is_groupchat: { type: Boolean },
            message_limit: { type: Number },
            model: { type: Object },
            show_call_button: { type: Boolean },
            show_occupants_toggle: { type: Boolean },
            show_spoiler_button: { type: Boolean },
            show_emoji_button: { type: Boolean },
        }
    }

    render () {
        return html`${until(this.getButtons(), '')}`
    }

    getButtons () {
        const buttons = [];

        if (this.show_emoji_button) {
            buttons.push(html`<converse-emoji-dropdown .chatview=${this.chatview}></converse-dropdown>`);
        }

        if (this.show_call_button) {
            buttons.push(html`
                <button class="toggle-call" @click=${this.toggleCall} title="${i18n_start_call}">
                    <fa-icon class="fa fa-phone" path-prefix="/dist" color="var(--text-color-lighten-15-percent)" size="1em"></fa-icon>
                </button>`
            );
        }
        const message_limit = api.settings.get('message_limit');
        if (message_limit) {
            buttons.push(html`<span class="message-limit" title="${i18n_chars_remaining}">${this.message_limit}</span>`);
        }

        if (this.show_spoiler_button) {
            buttons.push(this.getSpoilerButton());
        }

        const http_upload_promise = api.disco.supports(Strophe.NS.HTTPUPLOAD, _converse.domain);
        buttons.push(html`${until(http_upload_promise.then(() =>
            html`<button title="${i18n_choose_file}" @click=${this.toggleFileUpload}>
                    <fa-icon class="fa fa-paperclip"
                             path-prefix="${api.settings.get('assets_path')}"
                             color="var(--text-color-lighten-15-percent)"
                             size="1em"></fa-icon>
                </button>
                <input type="file" @change=${this.onFileSelection} class="fileupload" multiple="" style="display:none"/>
            `),'')}`
        );

        if (this.show_occupants_toggle) {
            buttons.push(html`
                <button class="toggle_occupants"
                        title="${this.hidden_occupants ? i18n_show_occupants : i18n_hide_occupants}"
                        @click=${this.toggleOccupants}>
                    <fa-icon class="fa ${this.hidden_occupants ? `fa-angle-double-left` : `fa-angle-double-right`}"
                             path-prefix="${api.settings.get('assets_path')}" color="var(--text-color-lighten-15-percent)" size="1em"></fa-icon>
                </button>`
            );
        }

        /**
         * *Hook* which allows plugins to add more buttons to a chat's toolbar
         * @event _converse#getToolbarButtons
         */
        return _converse.api.hook('getToolbarButtons', this, buttons);
    }

    getSpoilerButton () {
        if (!this.is_groupchat && this.model.presence.resources.length === 0) {
            return;
        }

        let i18n_toggle_spoiler;
        if (this.model.get('composing_spoiler')) {
            i18n_toggle_spoiler = __("Click to write as a normal (non-spoiler) message");
        } else {
            i18n_toggle_spoiler = __("Click to write your message as a spoiler");
        }
        const markup = html`
            <button class="toggle-compose-spoiler"
                    title="${i18n_toggle_spoiler}"
                    @click=${this.toggleComposeSpoilerMessage}>
                <fa-icon class="fa ${this.composing_spoiler ? 'fa-eye-slash' : 'fa-eye'}"
                         path-prefix="${api.settings.get('assets_path')}"
                         color="var(--text-color-lighten-15-percent)"
                         size="1em"></fa-icon>
            </button>`;

        if (this.is_groupchat) {
            return markup;
        } else {
            const contact_jid = this.model.get('jid');
            const spoilers_promise = Promise.all(
                this.model.presence.resources.map(
                    r => api.disco.supports(Strophe.NS.SPOILER, `${contact_jid}/${r.get('name')}`)
                )).then(results => results.reduce((acc, val) => (acc && val), true));
            return html`${until(spoilers_promise.then(() => markup), '')}`;
        }
    }

    toggleFileUpload (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        this.querySelector('.fileupload').click();
    }

    onFileSelection (evt) {
        this.model.sendFiles(evt.target.files);
    }

    toggleComposeSpoilerMessage (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        this.model.set('composing_spoiler', !this.model.get('composing_spoiler'));
    }

    toggleOccupants (ev) {
        if (ev) {
            ev.preventDefault();
            ev.stopPropagation();
        }
        this.model.save({'hidden_occupants': !this.model.get('hidden_occupants')});
    }

    toggleCall (ev) {
        ev.stopPropagation();
        /**
         * When a call button (i.e. with class .toggle-call) on a chatbox has been clicked.
         * @event _converse#callButtonClicked
         * @type { object }
         * @property { Strophe.Connection } _converse.connection - The XMPP Connection object
         * @property { _converse.ChatBox | _converse.ChatRoom } _converse.connection - The XMPP Connection object
         * @example _converse.api.listen.on('callButtonClicked', (connection, model) => { ... });
         */
        api.trigger('callButtonClicked', {
            connection: _converse.connection,
            model: this.model
        });
    }
}

window.customElements.define('converse-chat-toolbar', ChatToolbar);
