/* eslint-disable @typescript-eslint/no-explicit-any */

import { format } from 'date-fns';

export const gameResult = {
  name: 'gameResult',
  type: 'document',
  fields: [
    { name: 'schedule', type: 'reference', to: [{ type: 'schedule' }] },
    { name: 'author', type: 'reference', to: [{ type: 'user' }] },
    {
      name: 'games',
      title: 'Games',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'court',
              title: 'Court Number',
              type: 'string',
              description: '코트 번호',
            },
            {
              name: 'players',
              title: 'Players',
              type: 'array',
              of: [{ type: 'string' }],
              description: '참가하는 플레이어 이름 리스트',
            },
            {
              name: 'score',
              title: 'Score',
              type: 'array',
              of: [{ type: 'string' }],
              description: '경기 스코어 (팀별 점수)',
            },
            {
              name: 'time',
              title: 'Game Time',
              type: 'string',
              description: "경기 시작 시간 (예: '19:00')",
            },
          ],
          preview: {
            select: {
              court: 'court',
              time: 'time',
              players: 'players',
            },
            prepare({ court, time, players }: any) {
              return {
                title: `Court ${court || '-'}`,
                subtitle: `${time || ''} | ${players?.join(', ') || ''}`,
              };
            },
          },
        },
      ],
    },
    {
      name: 'comments',
      title: 'Comments',
      type: 'array',
      of: [
        {
          name: 'comment',
          type: 'object',
          fields: [
            {
              name: 'author',
              type: 'reference',
              to: [{ type: 'user' }],
            },
            {
              name: 'text',
              type: 'string',
              title: 'Comment Text',
            },
            {
              name: 'createdAt',
              type: 'datetime',
              title: 'Created At',
              readOnly: true,
            },
          ],
          preview: {
            select: {
              text: 'text',
              authorName: 'author.name',
            },
            prepare({ text, authorName }: any) {
              return {
                title: text
                  ? text.substring(0, 50) + (text.length > 50 ? '...' : '')
                  : 'Empty comment',
                subtitle: `by ${authorName || 'Unknown'}`,
              };
            },
          },
        },
      ],
    },
    {
      name: 'status',
      title: 'Game Status',
      type: 'string',
      options: {
        list: [
          { title: '대기중', value: 'wait' },
          { title: '게임중', value: 'ing' },
          { title: '게임완료', value: 'done' },
        ],
        layout: 'radio',
      },
      description: '게임 상태(대기중/게임중/게임완료)',
      initialValue: 'standby',
    },
    {
      name: 'editHistory',
      title: '수정 이력',
      type: 'array',
      of: [
        {
          name: 'editor',
          type: 'object',
          fields: [
            {
              name: 'author',
              type: 'reference',
              to: [{ type: 'user' }],
            },
            {
              name: 'createdAt',
              type: 'datetime',
              title: 'Created At',
              readOnly: true,
            },
          ],
          preview: {
            select: {
              author: 'author.name',
              createdAt: 'createdAt',
            },
            prepare({ author, createdAt }: any) {
              return {
                title: author ? `${author}` : '알 수 없음',
                subtitle: createdAt
                  ? `수정일: ${new Date(createdAt).toLocaleString()}`
                  : '',
              };
            },
          },
        },
      ],
    },
  ],
  preview: {
    select: {
      title: 'schedule.date',
      subtitle: 'schedule.courtName',
    },
    prepare({ title, subtitle }: any) {
      return {
        title: format(new Date(title), 'yyyy.MM.dd'),
        subtitle,
      };
    },
  },
};
