# -*- coding: utf-8 -*-
# Analytics package for tracking and measuring with services like Segment.
# Heavily borrowed from RapidPro's temba.utils.analytics

import analytics as segment_analytics

from django.conf import settings


_segment = False


def init_analytics():
    """Initialize the analytics agents with write credentials."""
    segment_write_key = getattr(settings, 'SEGMENT_WRITE_KEY', None)
    if segment_write_key:
        global _segment
        segment_analytics.write_key = segment_write_key
        _segment = True


def get_user_id(user):
    """Return a user email or username or the string 'anonymous'"""
    if user:
        return user.email or user.username

    return 'anonymous'


def track(user, event_name, properties=None, context=None, request=None):
    """Record actions with the track() API call to the analytics agents."""
    if _segment:
        context = context or {}
        context['source'] = settings.HOSTNAME

        properties = properties or {}

        if 'value' not in properties:
            properties['value'] = 1

        if 'submitted_by' in properties:
            properties['event_by'] = get_user_id(properties['submitted_by'])
            context['event_by'] = properties['event_by']

        if 'xform_id' in properties:
            context['xform_id'] = properties['xform_id']

        if request:
            context['userAgent'] = request.META.get('HTTP_USER_AGENT', '')
            context['ip'] = request.META.get('REMOTE_ADDR', '')
            context['page'] = {
                'path': request.path,
                'url': request.META.get('HTTP_HOST', ''),
            }

        user_id = get_user_id(user)
        segment_analytics.track(user_id, event_name, properties, context)
