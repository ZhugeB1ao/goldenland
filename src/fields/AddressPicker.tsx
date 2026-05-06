'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useField } from '@payloadcms/ui'

interface Division {
    code: string
    name: string
}

interface Props {
    provinceField: string
    wardField: string
}

export const AddressPicker: React.FC<Props> = ({
    provinceField = 'provinceCode',
    wardField = 'wardCode',
}) => {
    const { value: provinceValue, setValue: setProvince } = useField<string>({
        path: provinceField,
    })
    const { value: wardValue, setValue: setWard } = useField<string>({
        path: wardField,
    })

    const [provinces, setProvinces] = useState<Division[]>([])
    const [wards, setWards] = useState<Division[]>([])
    const [loadingWards, setLoadingWards] = useState(false)

    // Load 34 tỉnh/thành phố
    useEffect(() => {
        fetch('/api/divisions/provinces')
            .then((res) => res.json())
            .then(setProvinces)
    }, [])

    // Load phường/xã khi chọn tỉnh
    useEffect(() => {
        if (!provinceValue) {
            setWards([])
            return
        }
        setLoadingWards(true)
        fetch(`/api/divisions/wards/${provinceValue}`)
            .then((res) => res.json())
            .then((data) => {
                setWards(data)
                setLoadingWards(false)
            })
    }, [provinceValue])

    const handleProvinceChange = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement>) => {
            setProvince(e.target.value)
            setWard('')
        },
        [setProvince, setWard],
    )

    const handleWardChange = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement>) => {
            setWard(e.target.value)
        },
        [setWard],
    )

    const selectStyle: React.CSSProperties = {
        width: '100%',
        padding: '10px',
        borderRadius: '4px',
        border: '1px solid var(--theme-elevation-150)',
        backgroundColor: 'var(--theme-input-bg)',
        color: 'var(--theme-text)',
        fontSize: '14px',
    }

    return (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                    Tỉnh / Thành phố
                </label>
                <select value={provinceValue || ''} onChange={handleProvinceChange} style={selectStyle}>
                    <option value="">-- Chọn tỉnh --</option>
                    {provinces.map((p) => (
                        <option key={p.code} value={p.code}>
                            {p.name}
                        </option>
                    ))}
                </select>
            </div>

            <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                    Phường / Xã
                </label>
                <select
                    value={wardValue || ''}
                    onChange={handleWardChange}
                    disabled={!provinceValue || loadingWards}
                    style={selectStyle}
                >
                    <option value="">
                        {loadingWards ? 'Đang tải...' : '-- Chọn phường/xã --'}
                    </option>
                    {wards.map((w) => (
                        <option key={w.code} value={w.code}>
                            {w.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    )
}
