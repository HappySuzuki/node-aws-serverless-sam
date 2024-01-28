import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { uuid } from 'uuidv4';

export const FALLBACK_API_ERROR_MSG = 'Something went wrong. Please try again.';

const dynamo = new DynamoDB.DocumentClient({
    endpoint: 'http://host.docker.internal:8000',
    // endpoint: 'http://docker.for.mac.localhost:8000',
});
const TABLE_NAME = process.env.SAMPLE_TABLE as string;

type Note = {
    id: string;
    title: string;
    content: string;
};

type NotePayload = Partial<Note>;

export const getNotes = async (): Promise<APIGatewayProxyResult> => {
    try {
        const data = await dynamo.scan({ TableName: TABLE_NAME }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Get notes',
                data: data.Items,
            }),
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: getErrorMessage(err),
            }),
        };
    }
};

export const getNote = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        if (!event.pathParameters || !event.pathParameters.id) throw new Error();

        const id = event.pathParameters.id;

        const note = await readItem(id);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Get note',
                data: note,
            }),
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: getErrorMessage(err),
            }),
        };
    }
};

export const deleteNote = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        if (!event.pathParameters || !event.pathParameters.id) throw new Error();

        const id = event.pathParameters.id;

        const params = {
            TableName: TABLE_NAME,
            Key: {
                id: id,
            },
        };

        const deletedNote = await dynamo.delete(params).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Note deleted successfully!',
                data: deletedNote,
            }),
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: getErrorMessage(err),
            }),
        };
    }
};

export const createNote = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        if (!event.body) throw new Error();
        const body = JSON.parse(event.body) as NotePayload;

        if (!body.title) throw new Error('Note title is required.');

        const item = {
            id: uuid(),
            name: body.title,
            content: body.content || '',
        };

        const createdNote = await writeItem(item);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Note created successfully!',
                data: createdNote,
            }),
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: getErrorMessage(err),
            }),
        };
    }
};

export const updateNote = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        if (!event.body) throw new Error();
        const body = JSON.parse(event.body) as NotePayload;

        if (!body.id) throw new Error('Note id is required.');

        const params = {
            TableName: TABLE_NAME,
            Key: {
                id: body.id,
            },
            UpdateExpression: 'set title = :t, content = :c',
            ExpressionAttributeValues: {
                ':t': body.title,
                ':c': body.content,
            },
            ReturnValues: 'UPDATED_NEW',
        };

        const updatedItem = await dynamo.update(params).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Note updated successfully!',
                data: updatedItem,
            }),
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: getErrorMessage(err),
            }),
        };
    }
};

const writeItem = async (item: any) => {
    const params = {
        TableName: TABLE_NAME,
        Item: item,
    };

    return dynamo
        .put(params)
        .promise()
        .then(() => {
            return item;
        });
};

const readItem = async (id: string) => {
    const params = {
        TableName: TABLE_NAME,
        Key: { id: id },
    };
    const data = await dynamo.get(params).promise();
    return data.Item;
};

const getErrorMessage = (error: unknown) => {
    console.log('error', error);

    let message = FALLBACK_API_ERROR_MSG;
    if (error instanceof Error) message = error.message;
    return message;
};
