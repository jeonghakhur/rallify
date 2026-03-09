import React from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const courtSchedule = {
  name: 'schedule',
  type: 'document',
  title: 'Schedule',
  fields: [
    { name: 'author', type: 'reference', to: [{ type: 'user' }] },
    { name: 'date', type: 'string', title: 'Date' },
    { name: 'startTime', type: 'string', title: 'StartTime' },
    { name: 'endTime', type: 'string', title: 'EndTime' },
    { name: 'courtName', type: 'string', title: 'CourtName' },
    { name: 'courtCount', type: 'string', title: 'CourtCount' },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      description: '스케줄의 현재 상태',
      options: {
        list: [
          { title: '대기중', value: 'pending' },
          { title: '참석자 등록', value: 'attendeese' },
          { title: '대진표 작성', value: 'matchmaking' },
          { title: '대진표 공유', value: 'shared' },
          { title: '게임진행', value: 'playing' },
          { title: '게임완료', value: 'done' },
        ],
        layout: 'dropdown',
      },
    },
    {
      name: 'courtNumbers',
      title: 'Court Numbers',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'number', type: 'string', title: 'Court Number' },
            { name: 'startTime', type: 'string', title: 'Start Time' },
            { name: 'endTime', type: 'string', title: 'End Time' },
          ],
        },
      ],
    },
    {
      name: 'attendees',
      title: 'Attendees',
      type: 'array',
      of: [
        {
          name: 'attendee',
          type: 'object',
          fields: [
            {
              name: 'author',
              type: 'reference',
              to: [{ type: 'user' }],
            },
            { name: 'name', type: 'string', title: 'Name' },
            { name: 'startHour', type: 'string', title: 'Start Hour' },
            { name: 'startMinute', type: 'string', title: 'Start Minute' },
            { name: 'endHour', type: 'string', title: 'End Hour' },
            { name: 'endMinute', type: 'string', title: 'End Minute' },
            { name: 'gender', type: 'string', title: 'Gender' },
          ],
          preview: {
            select: {
              name: 'name',
              startHour: 'startHour',
              startMinute: 'startMinute',
              endHour: 'endHour',
              endMinute: 'endMinute',
              gender: 'gender',
            },
            prepare({
              name,
              startHour,
              startMinute,
              endHour,
              endMinute,
              gender,
            }: any) {
              return {
                title: name || 'Unknown',
                subtitle: `${gender} | ${startHour}:${startMinute} - ${endHour}:${endMinute}`,
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
  ],
  preview: {
    select: {
      courtName: 'courtName',
      date: 'date',
      authorName: 'author.name',
      authorUsername: 'author.username',
      media: 'author.image',
      // attendees: 'attendees',
    },
    prepare({ courtName, date, authorName, authorUsername, media }: any) {
      return {
        title: `${courtName} ${new Date(date).toLocaleDateString('ko-KR')}`,
        subtitle: `by ${authorName} (${authorUsername})`,
        media: media
          ? React.createElement('img', { src: media, alt: '' })
          : null,
      };
    },
  },
};
