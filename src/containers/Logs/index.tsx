import dayjs from 'dayjs'
import { camelCase } from 'lodash-es'
import { useLayoutEffect, useEffect, useRef, useState } from 'react'

import { ButtonSelect, Card, Header } from '@components'
import { Log } from '@models/Log'
import { useGeneral, useI18n, useLogsStreamReader } from '@stores'

import './style.scss'

const logLevelOptions = [
    { label: 'Debug', value: 'debug' },
    { label: 'Info', value: 'info' },
    { label: 'Warn', value: 'warning' },
    { label: 'Error', value: 'error' },
    { label: 'Silent', value: 'silent' },
]
const logMap = new Map([
    ['debug', 'text-teal-500'],
    ['info', 'text-sky-500'],
    ['warning', 'text-pink-500'],
    ['error', 'text-rose-500'],
])

export default function Logs () {
    const listRef = useRef<HTMLUListElement>(null)
    const logsRef = useRef<Log[]>([])
    const [logs, setLogs] = useState<Log[]>([])
    const { general } = useGeneral()
    const [logLevel, setLogLevel] = useState(general.logLevel)
    const { translation } = useI18n()
    const { t } = translation('Logs')
    const logsStreamReader = useLogsStreamReader(logLevel)
    const scrollHeightRef = useRef(listRef.current?.scrollHeight ?? 0)

    useEffect(() => {
        if (logLevel) {
            localStorage.setItem('log-level', logLevel)
        }
        setLogLevel(localStorage.getItem('log-level')!)
    }, [logLevel])

    useLayoutEffect(() => {
        const ul = listRef.current
        if (ul != null && scrollHeightRef.current === (ul.scrollTop + ul.clientHeight)) {
            ul.scrollTop = ul.scrollHeight - ul.clientHeight
        }
        scrollHeightRef.current = ul?.scrollHeight ?? 0
    })

    useEffect(() => {
        function handleLog (newLogs: Log[]) {
            logsRef.current = logsRef.current.slice().concat(newLogs.map(d => ({ ...d, time: new Date() })))
            setLogs(logsRef.current)
        }

        if (logsStreamReader != null) {
            logsStreamReader.subscribe('data', handleLog)
            logsRef.current = logsStreamReader.buffer()
            setLogs(logsRef.current)
        }
        return () => logsStreamReader?.unsubscribe('data', handleLog)
    }, [logsStreamReader])

    return (
        <div className="page">
            <Header title={ t('title') } >
                <ButtonSelect
                    options={logLevelOptions}
                    value={camelCase(logLevel)}
                    onSelect={ setLogLevel }
                />
            </Header>

            <Card className="flex flex-col flex-1 mt-2.5 md:mt-4">
                <ul className="logs-panel" ref={listRef}>
                    {
                        logs.map(
                            (log, index) => (
                                <li className="leading-5 inline-block text-[11px]" key={index}>
                                    <span className="mr-2 text-orange-400">[{ dayjs(log.time).format('YYYY-MM-DD HH:mm:ss') }]</span>
                                    <span className={logMap.get(log.type)}>[{ log.type.toUpperCase() }]</span>
                                    <span> { log.payload }</span>
                                </li>
                            ),
                        )
                    }
                </ul>
            </Card>
        </div>
    )
}
