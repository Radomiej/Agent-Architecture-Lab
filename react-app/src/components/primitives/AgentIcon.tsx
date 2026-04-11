import React from 'react'
import { AGENT_SVG, PRESET_SVG } from '../../data/agentSvg'
import { getAgentColor } from '../../data/agentColors'
import { useUiStore } from '../../store/uiStore'

interface AgentIconProps {
  id: string
  size?: number
  className?: string
  color?: string
  isPreset?: boolean
}

export const AgentIcon: React.FC<AgentIconProps> = ({ id, size = 24, className, color, isPreset = false }) => {
  const theme = useUiStore((s) => s.theme)
  const svgMap = isPreset ? PRESET_SVG : AGENT_SVG
  const path = svgMap[id] ?? AGENT_SVG['analyst']
  const resolvedColor = color ?? getAgentColor(id, theme)

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={resolvedColor}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: path }}
    />
  )
}
