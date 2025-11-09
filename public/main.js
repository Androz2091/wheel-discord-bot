import {
    createApp,
    defineComponent
} from 'vue';
import { createEmitter } from 'simpler-emitter';
import axios from 'axios';
import * as Sentry from '@sentry/browser';

const emitter = createEmitter();

Sentry.init({
    dsn: 'https://776f8b03278c4186b380924bc9a46ff2@glitchtip.kaki87.net/4',
    environment: window.location.hostname === 'wheelbot.mypokerradio.com' ? 'production' : 'development',
    beforeSend: (event, hint) => {
        emitter.emit('sentryCapturedError', hint.originalException);
        return event;
    }
});

const
    Main = defineComponent({}),
    Header = defineComponent({
        props: [
            'apiKey',
            'setApiKey'
        ],
        data: function(){
            return {
                apiKeyInput: this.apiKey,
                isLoading: false
            };
        },
        computed: {
            emitter: () => emitter
        },
        methods: {
            toggleAuthentication: async function(){
                if(this.apiKey){
                    this.apiKeyInput = '';
                    await this.setApiKey();
                    this.emitter.emit(
                        'toast',
                        {
                            body: 'Logged out',
                        }
                    );
                }
                else {
                    this.isLoading = true;
                    if(await this.setApiKey(this.apiKeyInput)){
                        this.emitter.emit(
                            'toast',
                            {
                                body: 'Logged in',
                                type: 'success'
                            }
                        );
                    }
                    else {
                        this.apiKeyInput = '';
                        setTimeout(() => document.querySelector('.Header__form__input').focus(), 0);
                        this.emitter.emit(
                            'toast',
                            {
                                body: 'Invalid API key',
                                type: 'danger'
                            }
                        );
                    }
                    this.isLoading = false;
                }
            }
        },
        //language=Vue
        template: `
            <header
                style="display: contents"
            ><nav
                class="Header navbar"
            >
                <p
                    class="Header__heading navbar-brand"
                >Wheel Bot - Dashboard</p>
                <form
                    class="Header__form input-group"
                    @submit.prevent="toggleAuthentication"
                >
                    <input
                        class="Header__form__input form-control"
                        type="password"
                        placeholder="API key"
                        aria-label="API key"
                        v-model="apiKeyInput"
                        :disabled="isLoading || !!apiKey"
                    >
                    <button
                        class="btn text-nowrap"
                        :class="{ 'btn-primary': !apiKey, 'btn-secondary': !!apiKey }"
                        type="submit"
                        :disabled="isLoading"
                    >{{ apiKey ? 'Log out' : 'Log in' }}</button>
                </form>
            </nav></header>
        `
    }),
    ToastContainer = defineComponent({
        data: () => ({
            toasts: []
        }),
        computed: {
            emitter: () => emitter
        },
        methods: {
            removeToast: function(toast){
                this.toasts.splice(this.toasts.indexOf(toast), 1);
            }
        },
        mounted: function(){
            emitter.on('toast', async toast => {
                this.toasts.unshift(toast);
                if(toast.type === 'danger') return;
                await new Promise(resolve => setTimeout(resolve, 10000));
                this.removeToast(toast);
            });
        },
        //language=Vue
        template: `
            <ul
                class="ToastContainer toast-container"
            >
                <li
                    v-for="toast in toasts"
                    class="ToastContainer__toast toast show"
                    :class="'border-' + toast.type"
                    aria-atomic="true"
                >
                    <p class="ToastContainer__toast__header toast-header">
                        <span
                            class="ToastContainer__toast__header__title"
                        >{{
                            toast.title
                            ||
                            {
                                'danger': 'Error',
                                'success': 'Success'
                            }[toast.type] || 'Info'
                        }}</span>
                        <button
                            class="ToastContainer__toast__title__close btn-close"
                            aria-label="Close"
                            @click="removeToast(toast)"
                        ></button>
                    </p>
                    <p
                        class="ToastContainer__toast__body toast-body"
                    >{{ toast.body }}</p>
                </li>
            </ul>
        `
    }),
    app = createApp({
        components: {
            ToastContainer,
            Header,
            Main
        },
        data: () => ({
            apiKey: undefined
        }),
        methods: {
            createApiClient: function(apiKey){
                app.config.globalProperties.baseUrl = window.localStorage.getItem('wheel-bot:baseUrlOverride') || window.location.origin;
                return axios.create({
                    baseURL: new URL('/api', this.baseUrl).href,
                    headers: {
                        'Authorization': `Apikey ${apiKey}`
                    }
                });
            },
            setApiKey: async function(apiKey){
                if(!apiKey){
                    this.apiKey = undefined;
                    app.config.globalProperties.apiClient = undefined;
                    return window.localStorage.removeItem('wheel-bot:apiKey')
                }
                const
                    apiClient = this.createApiClient(apiKey),
                    { status } = await apiClient({
                        method: 'HEAD',
                        url: '/schedule',
                        validateStatus: status => [200, 401].includes(status)
                    });
                if(status === 401)
                    return false;
                this.apiKey = apiKey;
                app.config.globalProperties.apiClient = apiClient;
                window.localStorage.setItem('wheel-bot:apiKey', apiKey);
                return true;
            }
        },
        beforeMount: async function(){
            this.apiKey = window.localStorage.getItem('wheel-bot:apiKey');
            if(this.apiKey)
                app.config.globalProperties.apiClient = this.createApiClient(this.apiKey);
        },
        mounted: function(){
            emitter.on(
                'sentryCapturedError',
                error => {
                    emitter.emit(
                        'toast',
                        {
                            title: 'Error',
                            body: error.message || error.toString() || 'Unknown error',
                            type: 'danger'
                        }
                    );
                }
            );
        },
        //language=Vue
        template: `
            <ToastContainer />
            <Header
                :apiKey="apiKey"
                :setApiKey="setApiKey"
            />
            <Main
                v-if="apiClient"
            />
        `
    });

app.config.errorHandler = error => Sentry.captureException(error);
app.mount(document.body);