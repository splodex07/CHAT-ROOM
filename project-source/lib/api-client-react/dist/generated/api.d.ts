import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { ChatMessage, ErrorResponse, HealthStatus, JoinRoomInput, RoomState, SendMessageInput } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetRoomStateUrl: (roomCode: string) => string;
/**
 * @summary Get the current state of a private room
 */
export declare const getRoomState: (roomCode: string, options?: RequestInit) => Promise<RoomState>;
export declare const getGetRoomStateQueryKey: (roomCode: string) => readonly [`/api/rooms/${string}`];
export declare const getGetRoomStateQueryOptions: <TData = Awaited<ReturnType<typeof getRoomState>>, TError = ErrorType<ErrorResponse>>(roomCode: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRoomState>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getRoomState>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetRoomStateQueryResult = NonNullable<Awaited<ReturnType<typeof getRoomState>>>;
export type GetRoomStateQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get the current state of a private room
 */
export declare function useGetRoomState<TData = Awaited<ReturnType<typeof getRoomState>>, TError = ErrorType<ErrorResponse>>(roomCode: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRoomState>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getJoinRoomUrl: (roomCode: string) => string;
/**
 * @summary Join a private chat room
 */
export declare const joinRoom: (roomCode: string, joinRoomInput: JoinRoomInput, options?: RequestInit) => Promise<RoomState>;
export declare const getJoinRoomMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof joinRoom>>, TError, {
        roomCode: string;
        data: BodyType<JoinRoomInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof joinRoom>>, TError, {
    roomCode: string;
    data: BodyType<JoinRoomInput>;
}, TContext>;
export type JoinRoomMutationResult = NonNullable<Awaited<ReturnType<typeof joinRoom>>>;
export type JoinRoomMutationBody = BodyType<JoinRoomInput>;
export type JoinRoomMutationError = ErrorType<ErrorResponse>;
/**
* @summary Join a private chat room
*/
export declare const useJoinRoom: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof joinRoom>>, TError, {
        roomCode: string;
        data: BodyType<JoinRoomInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof joinRoom>>, TError, {
    roomCode: string;
    data: BodyType<JoinRoomInput>;
}, TContext>;
export declare const getSendMessageUrl: (roomCode: string) => string;
/**
 * @summary Send a message to a private chat room
 */
export declare const sendMessage: (roomCode: string, sendMessageInput: SendMessageInput, options?: RequestInit) => Promise<ChatMessage>;
export declare const getSendMessageMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendMessage>>, TError, {
        roomCode: string;
        data: BodyType<SendMessageInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof sendMessage>>, TError, {
    roomCode: string;
    data: BodyType<SendMessageInput>;
}, TContext>;
export type SendMessageMutationResult = NonNullable<Awaited<ReturnType<typeof sendMessage>>>;
export type SendMessageMutationBody = BodyType<SendMessageInput>;
export type SendMessageMutationError = ErrorType<ErrorResponse>;
/**
* @summary Send a message to a private chat room
*/
export declare const useSendMessage: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendMessage>>, TError, {
        roomCode: string;
        data: BodyType<SendMessageInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof sendMessage>>, TError, {
    roomCode: string;
    data: BodyType<SendMessageInput>;
}, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map