/**
 * @module converse-emoji-views
 * @copyright 2020, the Converse.js contributors
 * @license Mozilla Public License (MPLv2)
 */
import "./components/emoji-picker.js";
import "@converse/headless/converse-emoji";
import bootstrap from "bootstrap.native";
import { View } from "@converse/skeletor/src/view";
import { __ } from '@converse/headless/i18n';
import { _converse, api, converse } from '@converse/headless/converse-core';
import { html } from "lit-html";

const u = converse.env.utils;


converse.plugins.add('converse-emoji-views', {
    /* Plugin dependencies are other plugins which might be
     * overridden or relied upon, and therefore need to be loaded before
     * this plugin.
     *
     * If the setting "strict_plugin_dependencies" is set to true,
     * an error will be raised if the plugin is not found. By default it's
     * false, which means these plugins are only loaded opportunistically.
     *
     * NB: These plugins need to have already been loaded via require.js.
     */
    dependencies: ["converse-emoji", "converse-chatview", "converse-muc-views"],


    overrides: {
        ChatBoxView: {
            events: {
                'click .toggle-smiley': 'toggleEmojiMenu',
            },

            onEnterPressed () {
                if (this.emoji_dropdown && u.isVisible(this.emoji_dropdown.el.querySelector('.emoji-picker'))) {
                    this.emoji_dropdown.toggle();
                }
                this.__super__.onEnterPressed.apply(this, arguments);
            },

            onKeyDown (ev) {
                if (ev.keyCode === converse.keycodes.TAB) {
                    const value = u.getCurrentWord(ev.target, null, /(:.*?:)/g);
                    if (value.startsWith(':')) {
                        ev.preventDefault();
                        ev.stopPropagation();
                        return this.autocompleteInPicker(ev.target, value);
                    }
                }
                return this.__super__.onKeyDown.call(this, ev);
            }
        },

        ChatRoomView: {
            events: {
                'click .toggle-smiley': 'toggleEmojiMenu'
            }
        }
    },


    initialize () {
        /* The initialize function gets called as soon as the plugin is
         * loaded by converse.js's plugin machinery.
         */
        api.settings.extend({
            'use_system_emojis': true,
            'visible_toolbar_buttons': {
                'emoji': true
            },
        });


        const emoji_aware_chat_view = {

            async autocompleteInPicker (input, value) {
                await this.createEmojiDropdown();
                this.emoji_picker_view.model.set({
                    'query': value,
                    'autocompleting': value,
                    'position': input.selectionStart
                });
                this.emoji_dropdown.toggle();
            },

        };
        Object.assign(_converse.ChatBoxView.prototype, emoji_aware_chat_view);


        _converse.EmojiPickerView = View.extend({
            className: 'emoji-picker dropdown-menu toolbar-menu',

            initialize (config) {
                this.chatview = config.chatview;
                this.listenTo(this.model, 'change', o => {
                    if (['current_category', 'current_skintone', 'query'].some(k => k in o.changed)) {
                        this.render();
                    }
                });
                this.render();
            },

            toHTML () {
                return html`<converse-emoji-picker
                        .chatview=${this.chatview}
                        .model=${this.model}
                        current_category="${this.model.get('current_category') || ''}"
                        current_skintone="${this.model.get('current_skintone') || ''}"
                        query="${this.model.get('query') || ''}"
                    ></converse-emoji-picker>`;
            }
        });


        /************************ BEGIN Event Handlers ************************/

        api.listen.on('chatBoxClosed', view => view.emoji_picker_view && view.emoji_picker_view.remove());

        api.listen.on('getToolbarButtons', (toolbar_el, buttons) => {
            if (api.settings.get('visible_toolbar_buttons').emoji) {
                buttons.push(html`<converse-emoji-dropdown .chatview=${toolbar_el.chatview}></converse-dropdown>`);
                return buttons;
            }
        });

        api.listen.on('headlinesBoxInitialized', () => api.emojis.initialize());
        api.listen.on('chatRoomInitialized', () => api.emojis.initialize());
        api.listen.on('chatBoxInitialized', () => api.emojis.initialize());

        /************************ END Event Handlers ************************/
    }
});
