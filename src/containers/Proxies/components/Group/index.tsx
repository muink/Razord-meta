import React, { useMemo } from 'react'
import { useRecoilValue } from 'recoil'
import { useProxy, useConfig, proxyMapping } from '@stores'
import { changeProxySelected, Group as IGroup, getConnections, closeConnection } from '@lib/request'
import { Tags, Tag } from '@components'
import './style.scss'

interface GroupProps {
    config: IGroup
}

export function Group (props: GroupProps) {
    const { update } = useProxy()
    const proxyMap = useRecoilValue(proxyMapping)
    const { data: Config } = useConfig()
    const { config } = props

    async function handleChangeProxySelected (name: string) {
        await changeProxySelected(props.config.name, name)
        await update()
        if (Config.breakConnections) {
            const list: string[] = []
            const snapshot = await getConnections()
            for (const connection of snapshot.data.connections) {
                if (connection.chains.includes(props.config.name)) {
                    list.push(connection.id)
                }
            }

            for (const id of list) {
                closeConnection(id)
            }
        }
    }

    const errSet = useMemo(() => {
        const set = new Set<string>()
        for (const proxy of config.all) {
            const history = proxyMap.get(proxy)?.history
            if (history?.length && history.slice(-1)[0].delay !== 0) {
                set.add(proxy)
            }
        }

        return set
    }, [proxyMap])

    const canClick = config.type === 'Selector'
    return (
        <div className="proxy-group">
            <div className="proxy-group-part">
                <span className="proxy-group-name">{ config.name }</span>
                <Tag className="proxy-group-type">{ config.type }</Tag>
            </div>
            <div className="proxy-group-tags-container">
                <Tags
                    className="proxy-group-tags"
                    data={config.all}
                    onClick={handleChangeProxySelected}
                    errSet={errSet}
                    select={config.now}
                    canClick={canClick}
                    rowHeight={30} />
            </div>
        </div>
    )
}
