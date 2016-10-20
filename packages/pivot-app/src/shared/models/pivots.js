import { simpleflake } from 'simpleflakes';
import PivotTemplates from '../models/pivotTemplates';
import _ from 'underscore';


function defaults() {
    return {
        id: simpleflake().toJSON(),
        enabled: false,
        pivotParameterKeys: [
            'mode', 'input', 'search', 'time'
        ],
        pivotParameters: {
            search: 'Enter search query',
            mode: PivotTemplates.get('all', 'Search Splunk').name,
            input: '*',
            time: '09/21/2016'
        }
    };
}

const initialSoftState = {
    status: {ok: true},
    resultCount: 0,
    resultSummary: {entities: []},
}

export function createPivotModel(serializedPivot) {
    const normalizedPivot = {
        ...defaults(),
        ...serializedPivot
    };
    return {
        ...normalizedPivot,
        ...initialSoftState
    };
}

export function serializePivotModel(pivot) {
    return _.pick(pivot, _.keys(defaults()));
}

export function clonePivotModel(pivot) {
    const deepCopy = JSON.parse(JSON.stringify(serializePivotModel(pivot)));
    return {
        ...deepCopy,
        id: simpleflake().toJSON(),
        ...initialSoftState
    };
}
