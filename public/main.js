import {
    createApp,
    defineComponent
} from 'vue';
import { createEmitter } from 'simpler-emitter';
import axios from 'axios';
import * as Sentry from '@sentry/browser';
import dayjs from 'dayjs';
import dayjsPluginDuration from 'dayjsPluginDuration';
import dayjsPluginRelativeTime from 'dayjsPluginRelativeTime';
import dayjsPluginLocalizedFormat from 'dayjsPluginLocalizedFormat';
import humanize from 'humanize-duration';

dayjs.extend(dayjsPluginDuration);
dayjs.extend(dayjsPluginRelativeTime);
dayjs.extend(dayjsPluginLocalizedFormat);

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
    durationInput = defineComponent({
        props: [
            'modelValue',
            'isInvalid'
        ],
        emits: [
            'update:modelValue'
        ],
        data: () => ({
            uuid: crypto.randomUUID().slice(-5)
        }),
        computed: {
            yearsValue: {
                get: function(){
                    return this.modelValue.years || undefined;
                },
                set: function(value){
                    this.$emit(
                        'update:modelValue',
                        { ...this.modelValue, years: value || undefined }
                    );
                }
            },
            monthsValue: {
                get: function(){
                    return this.modelValue.months || undefined;
                },
                set: function(value){
                    this.$emit(
                        'update:modelValue',
                        { ...this.modelValue, months: value || undefined }
                    );
                }
            },
            daysValue: {
                get: function(){
                    return this.modelValue.days || undefined;
                },
                set: function(value){
                    this.$emit(
                        'update:modelValue',
                        { ...this.modelValue, days: value || undefined }
                    );
                }
            },
            hoursValue: {
                get: function(){
                    return this.modelValue.hours || undefined;
                },
                set: function(value){
                    this.$emit(
                        'update:modelValue',
                        { ...this.modelValue, hours: value || undefined }
                    );
                }
            },
            minutesValue: {
                get: function(){
                    return this.modelValue.minutes || undefined;
                },
                set: function(value){
                    this.$emit(
                        'update:modelValue',
                        { ...this.modelValue, minutes: value || undefined }
                    );
                }
            },
            secondsValue: {
                get: function(){
                    return this.modelValue.seconds || undefined;
                },
                set: function(value){
                    this.$emit(
                        'update:modelValue',
                        { ...this.modelValue, seconds: value || undefined }
                    );
                }
            }
        },
        template: `
            <div class="durationInput">
                <div
                    class="input-group"
                    style="display: contents"
                >
                    <label
                        class="durationInput__label input-group-text"
                        :for="'durationInput__label--years--' + uuid"
                    >Years</label>
                    <input
                        class="durationInput__input form-control"
                        :class="{ 'is-invalid': isInvalid }"
                        :id="'durationInput__label--years--' + uuid"
                        type="number"
                        min="0"
                        placeholder="0"
                        v-model="yearsValue"
                    >
                </div>
                <div
                    class="input-group"
                    style="display: contents"
                >
                    <label
                        class="durationInput__label input-group-text"
                        :for="'durationInput__label--months--' + uuid"
                    >Months</label>
                    <input
                        class="durationInput__input form-control"
                        :class="{ 'is-invalid': isInvalid }"
                        :id="'durationInput__label--months--' + uuid"
                        type="number"
                        min="0"
                        placeholder="0"
                        v-model="monthsValue"
                    >
                </div>
                <div
                    class="input-group"
                    style="display: contents"
                >
                    <label
                        class="durationInput__label input-group-text"
                        :for="'durationInput__label--days--' + uuid"
                    >Days</label>
                    <input
                        class="durationInput__input form-control"
                        :class="{ 'is-invalid': isInvalid }"
                        :id="'durationInput__label--days--' + uuid"
                        type="number"
                        min="0"
                        placeholder="0"
                        v-model="daysValue"
                    >
                </div>
                <div
                    class="input-group"
                    style="display: contents"
                >
                    <label
                        class="durationInput__label input-group-text"
                        :for="'durationInput__label--hours--' + uuid"
                    >Hours</label>
                    <input
                        class="durationInput__input form-control"
                        :class="{ 'is-invalid': isInvalid }"
                        :id="'durationInput__label--hours--' + uuid"
                        type="number"
                        min="0"
                        placeholder="0"
                        v-model="hoursValue"
                    >
                </div>
                <div
                    class="input-group"
                    style="display: contents"
                >
                    <label
                        class="durationInput__label input-group-text"
                        :for="'durationInput__label--minutes--' + uuid"
                    >Minutes</label>
                    <input
                        class="durationInput__input form-control"
                        :class="{ 'is-invalid': isInvalid }"
                        :id="'durationInput__label--minutes--' + uuid"
                        type="number"
                        min="0"
                        placeholder="0"
                        v-model="minutesValue"
                    >
                </div>
                <div
                    class="input-group"
                    style="display: contents"
                >
                    <label
                        class="durationInput__label input-group-text"
                        :for="'durationInput__label--seconds--' + uuid"
                    >Secs.</label>
                    <input
                        class="durationInput__input form-control"
                        :class="{ 'is-invalid': isInvalid }"
                        :id="'durationInput__label--seconds--' + uuid"
                        type="number"
                        min="0"
                        placeholder="0"
                        v-model="secondsValue"
                    >
                </div>
            </div>
        `
    }),
    EditItem = defineComponent({
        components: {
            durationInput
        },
        props: [
            'item',
            'cancel',
            'save'
        ],
        data: () => ({
            isEnabledInput: undefined,
            messageContentInput: undefined,
            runDurationInput: undefined,
            startTimestampInput: undefined,
            intervalInput: undefined,
            durationInput: undefined,
            isRunDurationInvalid: false,
            isSaving: false
        }),
        methods: {
            onSubmit: async function(){
                if(!dayjs.duration(this.runDurationInput).valueOf())
                    return this.isRunDurationInvalid = true;
                this.isSaving = true;
                await this.save({
                    startTimestamp: dayjs(this.startTimestampInput).valueOf(),
                    isEnabled: this.isEnabledInput,
                    runDuration: this.runDurationInput,
                    duration: this.durationInput,
                    interval: this.intervalInput,
                    messageContent: this.messageContentInput
                });
            }
        },
        beforeMount: function(){
            this.isEnabledInput = this.item.isEnabled || false;
            this.messageContentInput = this.item.messageContent;
            this.runDurationInput = this.item.runDuration || {};
            this.startTimestampInput = dayjs(this.item.startTimestamp).format('YYYY-MM-DDTHH:mm:ss');
            this.intervalInput = this.item.interval || {};
            this.durationInput = this.item.duration || {};
            this.$watch(
                () => this.runDurationInput,
                () => this.isRunDurationInvalid = dayjs.duration(this.runDurationInput).valueOf() === 0
            );
        },
        //language=Vue
        template: `
            <div
                class="EditItem modal"
                aria-modal="true"
                role="dialog"
            ><div
                class="modal-dialog"
            ><div
                class="modal-content"
            ><form
                style="display: contents"
                @submit.prevent="onSubmit"
            ><fieldset
                style="display: contents"
                :disabled="isSaving"
            >
                <div class="modal-header">
                    <h5
                        class="modal-title"
                    >
                        <template
                            v-if="item.id"
                        >Editing item #{{item.id.slice(-5)}}</template>
                        <template
                            v-else
                        >Creating new item</template>
                    </h5>
                    <button
                        class="btn-close"
                        aria-label="Close"
                        type="button"
                        @click="cancel"
                    ></button>
                </div>
                <div
                    class="EditItem__form modal-body"
                >
                    <label
                        class="form-switch"
                        style="display: flex; column-gap: 0.5rem"
                    >
                        <input
                            class="form-check-input"
                            type="checkbox"
                            role="switch"
                            v-model="isEnabledInput"
                        >
                        <span>Enabled</span>
                    </label>
                    <label style="display: contents">
                        <span>Content</span>
                        <textarea
                            class="form-control"
                            name="content"
                            required
                            placeholder="Hello, World!"
                            style="resize: none; height: 5rem"
                            v-model="messageContentInput"
                            ref="contentInput"
                        ></textarea>
                    </label>
                    <span>Run duration</span>
                    <durationInput
                        v-model="runDurationInput"
                        :is-invalid="isRunDurationInvalid"
                    />
                    <label style="display: contents">
                        <span>Start date</span>
                        <input
                            type="datetime-local"
                            class="form-control"
                            step="1"
                            v-model="startTimestampInput"
                        >
                    </label>
                    <label style="display: contents">
                        <span>Interval</span>
                        <durationInput
                            v-model="intervalInput"
                        />
                    </label>
                    <label style="display: contents">
                        <span>Duration</span>
                        <durationInput
                            v-model="durationInput"
                        />
                    </label>
                </div>
                <div
                    class="modal-footer"
                >
                    <button
                        class="btn btn-secondary"
                        type="button"
                        :disabled="isSaving"
                        @click="cancel"
                    >Cancel</button>
                    <button
                        class="btn btn-primary"
                        type="submit"
                        :disabled="isSaving"
                    >Save</button>
                </div>
            </fieldset></form></div></div></div>
        `
    }),
    Main = defineComponent({
        components: {
            EditItem
        },
        data: () => ({
            isLoading: true,
            schedule: [],
            itemToBeDeleted: undefined,
            editingItem: undefined
        }),
        computed: {
            emitter: () => emitter,
            humanize: () => humanize,
            dayjs: () => dayjs
        },
        methods: {
            reloadSchedule: async function(){
                this.isLoading = true;
                this.schedule = (await this.apiClient('/schedule')).data;
                this.isLoading = false;
            },
            deleteItem: async function(item){
                await this.apiClient.delete(`/schedule/${item.id}`);
                this.emitter.emit(
                    'toast',
                    {
                        body: 'Item deleted',
                        type: 'success'
                    }
                );
                this.itemToBeDeleted = undefined;
                await this.reloadSchedule();
            },
            closeItemEdit: async function(editedData){
                if(editedData){
                    if(this.editingItem.id)
                        await this.apiClient.patch(`/schedule/${this.editingItem.id}`, editedData);
                    else
                        await this.apiClient.post('/schedule', editedData);
                    await this.reloadSchedule();
                }
                this.editingItem = undefined;
            }
        },
        mounted: async function(){
            await this.reloadSchedule();
        },
        //language=Vue
        template: `
            <main
                class="Main"
            >
                <p
                    v-if="isLoading"
                    class="Main__loading"
                ><i
                    class="spinner-border"
                ></i></p>
                <template v-else>
                    <div
                        class="Main__schedule--container"
                    ><table
                        class="Main__schedule table table-hover"
                    >
                        <thead
                            class="table-secondary"
                        ><tr
                            class="Main__schedule__header"
                        >
                            <th>#</th>
                            <th>Enabled</th>
                            <th>Content</th>
                            <th>Run duration</th>
                            <th>Start date</th>
                            <th>Interval</th>
                            <th>Duration</th>
                            <th>Last run date</th>
                            <th></th>
                        </tr></thead>
                        <tbody>
                            <tr
                                v-for="item in schedule"
                            >
                                <td>{{ item.id.slice(-5) }}</td>
                                <td><i
                                    class="ph"
                                    :class="item.isEnabled ? 'ph-check' : 'ph-x'"
                                ></i></td>
                                <td
                                    class="Main__schedule__item__content"
                                >{{ item.messageContent }}</td>
                                <td
                                    class="Main__schedule__item__runDuration"
                                >{{ humanize(dayjs.duration(item.runDuration).valueOf()) }}</td>
                                <td
                                    class="Main__schedule__item__startDate"
                                    :title="item.startTimestamp ? dayjs(item.startTimestamp).format('dddd, MMMM D, YYYY hh:mm:ss A') : undefined"
                                >{{ dayjs(item.startTimestamp).format('lll') }}</td>
                                <td
                                    class="Main__schedule__item__interval"
                                >{{ item.interval && dayjs.duration(item.interval).valueOf() ? humanize(dayjs.duration(item.interval).valueOf()) : '-' }}</td>
                                <td
                                    class="Main__schedule__item__duration"
                                >{{ item.duration && dayjs.duration(item.duration).valueOf() ? humanize(dayjs.duration(item.duration).valueOf()) : '-' }}</td>
                                <td
                                    class="Main__schedule__item__lastRunDate"
                                    :title="item.lastRunStartTimestamp ? dayjs(item.lastRunStartTimestamp).format('dddd, MMMM D, YYYY hh:mm:ss A') : undefined"
                                >{{ item.lastRunStartTimestamp ? dayjs(item.lastRunStartTimestamp).format('lll') : '-' }}</td>
                                <td
                                    class="Main__schedule__item__actions"
                                >
                                    <span class="Main__schedule__item__actions__buttons">
                                        <button
                                            class="btn btn-secondary"
                                            aria-label="Edit"
                                            @click="editingItem = item"
                                        ><i
                                            class="ph ph-pencil"
                                        ></i></button>
                                        <button
                                            class="btn btn-danger"
                                            aria-label="Delete"
                                            @click="itemToBeDeleted = item"
                                        ><i
                                            class="ph ph-trash"
                                        ></i></button>
                                    </span>
                                    <div
                                        v-if="itemToBeDeleted === item"
                                        class="Main__schedule__item__actions__deletionConfirmation popover bs-popover-bottom"
                                        data-popper-placement="bottom"
                                    >
                                        <div
                                            class="popover-arrow"
                                            style="position: absolute; right: 0; transform: translate(-15px, 2px);"
                                        ></div>
                                        <div
                                            class="popover-body"
                                        >
                                            <p>Are you sure you want to delete this item?</p>
                                            <div style="display: flex; justify-content: end; column-gap: 0.5rem">
                                                <button
                                                    class="btn btn-secondary"
                                                    @click="itemToBeDeleted = undefined"
                                                >No, cancel</button>
                                                <button
                                                    class="btn btn-danger"
                                                    @click="deleteItem(item)"
                                                >Yes, delete</button>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table></div>
                    <button
                        class="Main__add btn btn-primary"
                        aria-label="Add message"
                        @click="editingItem = {}"
                    ><i
                        class="ph ph-plus"
                    ></i></button>
                </template>
                <EditItem
                    v-if="editingItem"
                    :item="editingItem"
                    :cancel="() => closeItemEdit()"
                    :save="closeItemEdit"
                />
            </main>
        `
    }),
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